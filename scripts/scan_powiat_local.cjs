/**
 * Skan firm w powiecie przez Overpass API (OpenStreetMap) — wersja do
 * uruchamiania lokalnie przez agenta (scripts/agent.cjs), nie na VPS-ie.
 * Overpass mocniej dławi ruch z adresów datacenter/VPS niż z domowych łączy,
 * stąd przeniesienie skanu poza serwer (analogicznie do scrapera regiowyniki).
 *
 * Baza (SponsorLead/Sponsor) jest dostępna tylko z serwera, więc ten skrypt
 * tylko pobiera i parsuje dane z Overpass — deduplikacja ze znanymi leadami
 * dzieje się na serwerze w POST /api/agent/skanuj, po odesłaniu wyniku.
 * Wynik zapisywany w tmp/scan_powiat_output.json.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT, 'tmp', 'scan_powiat_output.json');

const powiat = process.argv[2];

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const ROUNDS = 4;
const BACKOFF_MS = [15000, 30000, 60000]; // między rundami 1→2, 2→3, 3→4

const AMENITY_WHITELIST = [
  'restaurant', 'cafe', 'bar', 'pub', 'fast_food', 'fuel', 'bank', 'pharmacy',
  'car_rental', 'car_wash', 'veterinary', 'dentist', 'clinic', 'driving_school', 'cinema',
];

function overpassQuery(p) {
  const amenityRegex = AMENITY_WHITELIST.join('|');
  return `[out:json][timeout:25];
area["name"="${p}"]["boundary"="administrative"]->.a;
(
  node["shop"]["name"](area.a);
  node["office"]["name"](area.a);
  node["craft"]["name"](area.a);
  node["amenity"~"^(${amenityRegex})$"]["name"](area.a);
);
out tags 300;`;
}

function kategoria(tags) {
  if (tags.shop) return `sklep (${tags.shop})`;
  if (tags.office) return `biuro (${tags.office})`;
  if (tags.craft) return `rzemiosło (${tags.craft})`;
  if (tags.amenity) return tags.amenity;
  return 'inne';
}

function adres(tags) {
  const parts = [];
  if (tags['addr:street']) parts.push(`${tags['addr:street']}${tags['addr:housenumber'] ? ' ' + tags['addr:housenumber'] : ''}`);
  else if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
  if (tags['addr:city']) parts.push(tags['addr:city']);
  return parts.join(', ') || null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(msg) {
  console.log(`[scan_powiat] ${msg}`);
}

async function fetchOverpass(endpoint, query) {
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // Apache przed Overpass odrzuca requesty bez Accept (406) — fetch() w
      // Node domyślnie go nie wysyła. User-Agent zgodnie z polityką Overpass.
      'Accept': '*/*',
      'User-Agent': 'drawa-fc-sponsor-crm/1.0 (https://mksdrawadrawno.pl; kontakt: kontakt@mksdrawadrawno.pl)',
    },
    body: 'data=' + encodeURIComponent(query),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`HTTP ${r.status} ${text.slice(0, 150)}`);
  }
  return r.json();
}

async function main() {
  if (!powiat) {
    console.error('Brak parametru powiatu');
    process.exit(1);
  }

  const query = overpassQuery(powiat);
  const errors = [];
  let data = null;

  roundsLoop:
  for (let round = 1; round <= ROUNDS; round++) {
    for (const endpoint of OVERPASS_ENDPOINTS) {
      log(`Runda ${round}/${ROUNDS} — próbuję ${new URL(endpoint).host}...`);
      try {
        data = await fetchOverpass(endpoint, query);
        break roundsLoop;
      } catch (e) {
        errors.push(`${endpoint}: ${e.message}`);
        log(`Błąd (${endpoint}): ${e.message}`);
      }
    }
    if (round < ROUNDS) {
      const wait = BACKOFF_MS[round - 1];
      log(`Wszystkie serwery zajęte — czekam ${Math.round(wait / 1000)}s przed kolejną próbą...`);
      await sleep(wait);
    }
  }

  if (!data) {
    console.error(`Nie udało się połączyć z żadnym serwerem Overpass po ${ROUNDS} rundach. Ostatnie błędy: ${errors.slice(-3).join(' | ')}`);
    process.exit(1);
  }

  const seen = new Set();
  const results = [];
  for (const el of data.elements || []) {
    const tags = el.tags || {};
    const nazwa = tags.name?.trim();
    if (!nazwa) continue;
    const key = nazwa.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    results.push({
      nazwa,
      telefon: tags.phone || tags['contact:phone'] || null,
      www: tags.website || tags['contact:website'] || null,
      adres: adres(tags),
      kategoria: kategoria(tags),
    });
  }
  results.sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'));

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ powiat, results }, null, 2));
  log(`Gotowe — ${results.length} firm.`);
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});

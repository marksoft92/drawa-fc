/**
 * Skan firm w powiecie przez Overpass API (OpenStreetMap) — uruchamiany jako
 * osobny proces (jak scraper/batch_rewrite), żeby nie być związanym limitem
 * czasu żądania HTTP/Cloudflare. Publiczny Overpass bywa przeciążony, więc
 * próbujemy kilku instancji w kilku rundach z odczekaniem między nimi, zamiast
 * poddawać się po jednej nieudanej próbie.
 * Status zapisywany w tmp/scan_powiat_status.json.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ROOT = path.join(__dirname, '..');
const TMP_DIR = path.join(ROOT, 'tmp');
const STATUS_FILE = path.join(TMP_DIR, 'scan_powiat_status.json');

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

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeStatus(data) {
  ensureDir(TMP_DIR);
  fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
}

function readStatus() {
  try { return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8')); }
  catch { return { status: 'idle' }; }
}

function wasStopped() {
  return readStatus().status !== 'running';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
    writeStatus({ status: 'error', error: 'Brak parametru powiatu', finishedAt: new Date().toISOString() });
    process.exit(1);
  }

  const startedAt = new Date().toISOString();
  const query = overpassQuery(powiat);
  const errors = [];
  let data = null;

  roundsLoop:
  for (let round = 1; round <= ROUNDS; round++) {
    for (const endpoint of OVERPASS_ENDPOINTS) {
      if (wasStopped()) return; // anulowane z panelu (DELETE)
      writeStatus({
        status: 'running', startedAt, powiat,
        progress: `Runda ${round}/${ROUNDS} — próbuję ${new URL(endpoint).host}...`,
      });
      try {
        data = await fetchOverpass(endpoint, query);
        break roundsLoop;
      } catch (e) {
        errors.push(`${endpoint}: ${e.message}`);
      }
    }
    if (round < ROUNDS) {
      const wait = BACKOFF_MS[round - 1];
      writeStatus({
        status: 'running', startedAt, powiat,
        progress: `Wszystkie serwery zajęte — czekam ${Math.round(wait / 1000)}s przed kolejną próbą (${round}/${ROUNDS})...`,
      });
      await sleep(wait);
    }
  }

  if (wasStopped()) return;

  if (!data) {
    writeStatus({
      status: 'error', startedAt, powiat,
      error: `Nie udało się połączyć z żadnym serwerem Overpass po ${ROUNDS} rundach. Ostatnie błędy: ${errors.slice(-3).join(' | ')}`,
      finishedAt: new Date().toISOString(),
    });
    return;
  }

  const connStr = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString: connStr.replace(/\?.*$/, '') });
  try {
    const [leadyRes, sponsorzyRes] = await Promise.all([
      pool.query('SELECT nazwa FROM "SponsorLead"'),
      pool.query('SELECT nazwa FROM "Sponsor"'),
    ]);
    const known = new Set([
      ...leadyRes.rows.map(r => r.nazwa.toLowerCase().trim()),
      ...sponsorzyRes.rows.map(r => r.nazwa.toLowerCase().trim()),
    ]);

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
        status: known.has(key) ? 'exists' : 'pending',
      });
    }
    results.sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'));

    writeStatus({ status: 'done', startedAt, finishedAt: new Date().toISOString(), powiat, results });
  } finally {
    await pool.end();
  }
}

main().catch(e => {
  writeStatus({ status: 'error', startedAt: new Date().toISOString(), powiat, error: e.message, finishedAt: new Date().toISOString() });
  process.exit(1);
});

/**
 * Skan firm w powiecie przez Google Maps (Playwright) — do uruchamiania
 * lokalnie przez agenta (scripts/agent.cjs), nie na VPS-ie. Automatyzacja
 * przeglądarki z domowego IP ma dużo mniejsze ryzyko zablokowania niż z
 * adresu datacenter/VPS. Zastępuje wcześniejszą wersję opartą o Overpass
 * (OpenStreetMap) — ta dawała ubogie dane (rzadko telefon/WWW) i publiczne
 * serwery Overpass bywały nieosiągalne.
 *
 * Google Maps nie ma odpowiednika zapytania "wszystkie firmy w powiecie X"
 * jak Overpass — więc dla każdej gminy (głównej miejscowości) w powiecie i
 * każdej kategorii z listy robimy osobne wyszukiwanie, a dla każdego wyniku
 * wchodzimy na kartę firmy po telefon/WWW/adres (na liście wyników ich nie
 * ma). To wolniejsze niż jeden request do Overpass — skan całego powiatu
 * potrafi trwać kilkanaście do kilkudziesięciu minut.
 *
 * Baza (SponsorLead/Sponsor) jest dostępna tylko z serwera, więc ten skrypt
 * tylko zbiera i parsuje dane z Google Maps — deduplikacja ze znanymi
 * leadami dzieje się na serwerze w POST /api/agent/skanuj, po odesłaniu
 * wyniku. Progres wysyłany jest też stąd bezpośrednio (PATCH), bo skan trwa
 * zbyt długo, żeby czekać na pojedynczy komunikat z agent.cjs.
 *
 * Wynik zapisywany w tmp/scan_powiat_output.json.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT, 'tmp', 'scan_powiat_output.json');

const SITE = process.env.AGENT_SITE_URL || 'https://mksdrawadrawno.pl';
const TOKEN = process.env.AGENT_TOKEN;

const powiat = process.argv[2];

// Główne miejscowości (siedziby gmin) w każdym powiecie — Google Maps nie
// obsługuje zapytań po granicy administracyjnej jak Overpass, więc szukamy
// per miejscowość. Lista przybliżona (stan gmin na 2026) — do weryfikacji,
// jeśli jakaś gmina się zmieniła.
const POWIATY_MIEJSCOWOSCI = {
  'powiat choszczeński': ['Choszczno', 'Bierzwnik', 'Drawno', 'Krzęcin', 'Pełczyce', 'Recz'],
  'powiat myśliborski': ['Myślibórz', 'Barlinek', 'Boleszkowice', 'Dębno', 'Nowogródek Pomorski'],
  'powiat pyrzycki': ['Pyrzyce', 'Bielice', 'Kozielice', 'Lipiany', 'Przelewice', 'Warnice'],
  'powiat stargardzki': ['Stargard', 'Chociwel', 'Dobrzany', 'Dolice', 'Ińsko', 'Kobylanka', 'Marianowo', 'Stara Dąbrowa', 'Suchań'],
  'powiat drawski': ['Drawsko Pomorskie', 'Czaplinek', 'Kalisz Pomorski', 'Wierzchowo', 'Złocieniec'],
  'powiat wałecki': ['Wałcz', 'Człopa', 'Mirosławiec', 'Tuczno'],
  'powiat strzelecko-drezdenecki': ['Strzelce Krajeńskie', 'Dobiegniew', 'Drezdenko', 'Stare Kurowo', 'Zwierzyn'],
};

// Kategorie firm najbardziej sensowne jako leady sponsorskie — łatwo dopisać
// kolejne. Google Maps nie ma jednego zapytania "wszystkie sklepy/biura" jak
// Overpass, więc lista musi być jawna.
const KATEGORIE = [
  'restauracja', 'warsztat samochodowy', 'stacja paliw', 'apteka',
  'fryzjer salon kosmetyczny', 'weterynarz', 'stomatolog',
  'biuro rachunkowe', 'sklep spożywczy', 'piekarnia cukiernia',
];

const MAX_WYNIKOW_NA_ZAPYTANIE = 12;
const NAV_TIMEOUT = 25000;

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function jitter(base, spread) { return base + Math.random() * spread; }
function log(msg) { console.log(`[scan_powiat] ${msg}`); }

async function reportProgress(progress) {
  if (!TOKEN) return;
  try {
    await fetch(`${SITE}/api/agent/skanuj`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-agent-token': TOKEN },
      body: JSON.stringify({ progress }),
    });
  } catch { /* nieistotne, spróbujemy przy następnym update */ }
}

function isBlocked(html) {
  return /unusual traffic|nietypowy ruch z Twojej sieci|recaptcha/i.test(html);
}

async function setupPage(context) {
  const page = await context.newPage();
  await page.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (type === 'image' || type === 'media' || type === 'font') return route.abort();
    return route.continue();
  });
  return page;
}

async function acceptConsentIfPresent(page) {
  for (const sel of ['button:has-text("Odrzuć wszystko")', 'button:has-text("Zaakceptuj wszystko")']) {
    try {
      await page.click(sel, { timeout: 2000 });
      return;
    } catch { /* brak dialogu zgody — kolejne odsłony w tym kontekście już go nie pokazują */ }
  }
}

// Zwraca listę {nazwa, href} z panelu wyników wyszukiwania, przewijając po
// więcej, aż osiągnie limit albo przestanie przybywać.
async function zbierzWynikiWyszukiwania(page, query) {
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  await sleep(jitter(1800, 800));

  const html = await page.content();
  if (isBlocked(html)) throw new Error('BLOCKED');

  // Bardzo konkretne zapytanie (jedna trafiona firma) — Google Maps od razu
  // otwiera kartę miejsca zamiast listy wyników.
  if (/\/maps\/place\//.test(page.url())) {
    const nazwa = await page.locator('h1').first().innerText().catch(() => null);
    if (!nazwa) return [];
    return [{ nazwa: nazwa.trim(), href: page.url() }];
  }

  const feed = page.locator('div[role="feed"]');
  if (await feed.count() === 0) return [];

  let prevCount = -1;
  for (let i = 0; i < 6; i++) {
    const count = await page.locator('div[role="feed"] div[role="article"]').count();
    if (count >= MAX_WYNIKOW_NA_ZAPYTANIE || count === prevCount) break;
    prevCount = count;
    await feed.evaluate((el) => el.scrollBy(0, 2000)).catch(() => {});
    await sleep(jitter(900, 400));
  }

  const wyniki = await page.locator('div[role="feed"] a.hfpxzc').evaluateAll((els) =>
    els.map((el) => ({ nazwa: el.getAttribute('aria-label'), href: el.getAttribute('href') }))
  );
  return wyniki.filter((w) => w.nazwa && w.href).slice(0, MAX_WYNIKOW_NA_ZAPYTANIE);
}

// Wchodzi na kartę firmy po telefon/WWW/adres/kategorię — na liście wyników
// tych danych nie ma.
async function pobierzSzczegoly(page, href) {
  await page.goto(href, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  await sleep(jitter(1200, 600));

  const html = await page.content();
  if (isBlocked(html)) throw new Error('BLOCKED');

  const phoneLabel = await page.locator('button[data-item-id^="phone:"]').first().getAttribute('aria-label').catch(() => null);
  const addrLabel = await page.locator('button[data-item-id="address"]').first().getAttribute('aria-label').catch(() => null);
  const website = await page.locator('a[data-item-id="authority"]').first().getAttribute('href').catch(() => null);
  const kategoria = await page.locator('.mgr77e').first().innerText().catch(() => null);

  return {
    telefon: phoneLabel ? phoneLabel.replace(/^Telefon:\s*/i, '').trim() : null,
    adres: addrLabel ? addrLabel.replace(/^Adres:\s*/i, '').trim() : null,
    www: website || null,
    kategoria: kategoria ? kategoria.trim() : null,
  };
}

async function main() {
  if (!powiat) {
    console.error('Brak parametru powiatu');
    process.exit(1);
  }
  const miejscowosci = POWIATY_MIEJSCOWOSCI[powiat];
  if (!miejscowosci) {
    console.error(`Nieznany powiat: ${powiat}`);
    process.exit(1);
  }

  const zapytania = [];
  for (const m of miejscowosci) for (const k of KATEGORIE) zapytania.push({ m, k });
  log(`Start: ${powiat} — ${miejscowosci.length} miejscowości × ${KATEGORIE.length} kategorii = ${zapytania.length} zapytań`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'pl-PL',
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });
  const page = await setupPage(context);

  const seen = new Map(); // nazwa (lowercase) -> wynik
  let blockedStreak = 0;

  try {
    // Rozgrzewka: pierwsze wejście na maps.google.com pokazuje dialog zgody
    // RODO (przekierowanie na consent.google.com) — trzeba go kliknąć zanim
    // zaczniemy realne wyszukiwania, inaczej każde z nich odbije się o ten
    // sam dialog i zwróci 0 wyników bez żadnego błędu.
    await page.goto('https://www.google.com/maps', { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    await acceptConsentIfPresent(page);
    await sleep(jitter(1500, 500));

    for (let i = 0; i < zapytania.length; i++) {
      const { m, k } = zapytania[i];
      const progress = `Runda ${i + 1}/${zapytania.length} — ${k} w ${m}...`;
      log(progress);
      await reportProgress(progress);

      let lista;
      try {
        lista = await zbierzWynikiWyszukiwania(page, `${k} ${m}`);
        log(`  → ${lista.length} wyników`);
        blockedStreak = 0;
      } catch (e) {
        if (e.message === 'BLOCKED') {
          blockedStreak++;
          log(`Google zgłosił nietypowy ruch (${blockedStreak}) — czekam i próbuję dalej...`);
          if (blockedStreak >= 3) throw new Error('Google Maps zablokował ruch (nietypowy ruch / reCAPTCHA) po kilku próbach — przerywam skan.');
          await sleep(jitter(15000, 10000));
          continue;
        }
        log(`Błąd wyszukiwania "${k} ${m}": ${e.message}`);
        continue;
      }

      for (const w of lista) {
        const key = w.nazwa.toLowerCase().trim();
        if (seen.has(key)) continue;
        seen.set(key, { nazwa: w.nazwa.trim(), telefon: null, www: null, adres: null, kategoria: k });

        try {
          const szczegoly = await pobierzSzczegoly(page, w.href);
          const wpis = seen.get(key);
          wpis.telefon = szczegoly.telefon;
          wpis.www = szczegoly.www;
          wpis.adres = szczegoly.adres;
          if (szczegoly.kategoria) wpis.kategoria = szczegoly.kategoria;
          blockedStreak = 0;
        } catch (e) {
          if (e.message === 'BLOCKED') {
            blockedStreak++;
            if (blockedStreak >= 3) throw new Error('Google Maps zablokował ruch (nietypowy ruch / reCAPTCHA) po kilku próbach — przerywam skan.');
            await sleep(jitter(15000, 10000));
          }
          // Brak szczegółów (np. timeout) — zostawiamy sam wpis z listy, lepsze to niż nic.
        }
        await sleep(jitter(700, 500));
      }
    }
  } finally {
    await browser.close();
  }

  const results = [...seen.values()].sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'));
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ powiat, results }, null, 2));
  log(`Gotowe — ${results.length} firm.`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

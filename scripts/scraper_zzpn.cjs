/**
 * Drawa Drawno — ZZPN (rozgrywki.zzpn.pl) scraper
 *
 * Drugie źródło danych obok regiowyniki.pl (scraper_v5.cjs) — terminarz ligowy
 * z rozgrywki.zzpn.pl też ma składy i przebieg meczu, więc wynik jest mapowany
 * na dokładnie ten sam kształt JSON co scraper_v5.cjs (żeby panel/import mógł
 * używać obu źródeł zamiennie).
 *
 * Strona to SPA (React) — dane lecą z /api-proxy/*. Backend serwuje atrapę
 * (same "-1") jeśli User-Agent wygląda na headlessowy, więc kontekst przeglądarki
 * musi mieć "normalny" UA (bez "Headless" w stringu) — patrz openPage().
 *
 * Uruchomienie:
 *   node scripts/scraper_zzpn.cjs
 *
 * Wynik: tmp/scraper_output.json (ten sam plik co scraper_v5.cjs)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'https://rozgrywki.zzpn.pl';
// Klasa A Grupa 5 — liga Drawy na sezon 2026/2027. Zmienia się przy
// awansie/spadku, więc można nadpisać przez zmienną środowiskową.
const LEAGUE_ID = process.env.ZZPN_LEAGUE_ID || '6';
const DRAWA_TEAM_NAME = 'Drawa Drawno';
const ROOT = path.join(__dirname, '..');
const TMP_DIR = path.join(ROOT, 'tmp');

const MONTHS_PL = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

function ensureTmp() {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
}

function writeStatus(data) {
  ensureTmp();
  fs.writeFileSync(path.join(TMP_DIR, 'scraper_status.json'), JSON.stringify(data, null, 2));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function isDrawa(name) { return (name || '').toLowerCase().includes('drawa'); }

function formatDate(dateISO, timeISO) {
  if (!dateISO) return '';
  const [y, m, d] = dateISO.split('-').map(Number);
  const mon = MONTHS_PL[(m || 1) - 1] || '';
  const [hh, mm] = (timeISO || '00:00:00').split(':').map(Number);
  if (!hh && !mm) return `${d} ${mon}`;
  return `${d} ${mon} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

async function openPage(context, url) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(800);
  return page;
}

async function fetchJson(page, apiPath) {
  return page.evaluate((p) => fetch(p).then(r => r.json()), apiPath);
}

function cardLabel(cards) {
  if (!cards || cards.length === 0) return null;
  const types = cards.map(c => c.type);
  const yellows = types.filter(t => t === 'Yellow').length;
  if (types.includes('SecondYellow') || yellows >= 2) return 'żółto-czerwona';
  if (types.includes('Red')) return 'czerwona';
  if (yellows > 0) return 'żółta';
  return null;
}

function subLabel(subs) {
  if (!subs || subs.length === 0) return null;
  const hasIn = subs.some(s => s.type === 'In');
  const hasOut = subs.some(s => s.type === 'Out');
  if (hasIn && hasOut) return 'wszedł_i_zszedł';
  if (hasIn) return 'wszedł';
  if (hasOut) return 'zszedł';
  return null;
}

function parseTeamSquad(squad) {
  if (!Array.isArray(squad) || squad.length === 0) return null;
  const pierwsza11 = [], rezerwa = [];
  for (const p of squad) {
    const goals = Array.isArray(p.goals) ? p.goals : [];
    const zawodnik = {
      id: p.id,
      nazwisko: `${p.firstname || ''} ${p.lastname || ''}`.trim(),
      numer: p.number > 0 ? p.number : null,
      gole_w_meczu: goals.filter(g => !/own/i.test(g.type || '')).length,
      samobojcze_w_meczu: goals.filter(g => /own/i.test(g.type || '')).length,
      kartka_w_meczu: cardLabel(p.cards),
      zmiana_w_meczu: subLabel(p.substitutions),
    };
    if (p.type === 'Starter') pierwsza11.push(zawodnik); else rezerwa.push(zawodnik);
  }
  return { pierwsza11, rezerwa, ustawienie: null };
}

function typFromEvent(ev) {
  if (ev.type === 'Goal') return /own/i.test(ev.subType || '') ? 'samobójczy' : 'gol';
  if (ev.type === 'Card') {
    if (ev.subType === 'Yellow') return 'żółta kartka';
    if (ev.subType === 'Red') return 'czerwona kartka';
    if (ev.subType === 'SecondYellow') return 'żółto-czerwona';
    return 'kartka';
  }
  if (ev.type === 'Substitution') return 'zmiana';
  return 'nieznany';
}

function buildZdarzenia(eventsGrouped) {
  const flat = [];
  for (const period of (eventsGrouped || [])) {
    for (const ev of (period.events || [])) flat.push(ev);
  }
  flat.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));

  let hostGoals = 0, guestGoals = 0;
  return flat.map(ev => {
    const typ = typFromEvent(ev);
    if (typ === 'gol' || typ === 'samobójczy') {
      const scoringHost = typ === 'samobójczy' ? !ev.isHost : ev.isHost;
      if (scoringHost) hostGoals++; else guestGoals++;
    }
    const imie = ev.player ? `${ev.player.firstname || ''} ${ev.player.lastname || ''}`.trim() : null;
    return {
      minuta: ev.time != null ? String(ev.time) : (ev.minute ? ev.minute.replace("'", '') : null),
      zawodnik: imie || null,
      typ,
      strona: ev.isHost ? 'gospodarze' : 'goscie',
      wynik_po: `${hostGoals}:${guestGoals}`,
    };
  });
}

async function scrapeTabelaILiga(page) {
  console.log('  📊 Pobieram tabelę ligową...');
  const data = await fetchJson(page, `/api-proxy/table/${LEAGUE_ID}`);
  const rows = JSON.parse(data?.table?.rows || '[]');
  const tabela = rows.map(r => ({
    pozycja: r.index ?? null,
    nazwa: r.team?.name || '',
    herb: r.team?.logo || null,
    pkt: r.stats?.points ?? 0,
    mecze: r.stats?.matchesCount ?? 0,
    wygrane: r.stats?.winsCount ?? 0,
    remisy: r.stats?.drawsCount ?? 0,
    przegrane: r.stats?.losesCount ?? 0,
    bramki: `${r.stats?.goalsCount ?? 0}:${r.stats?.lostGoalsCount ?? 0}`,
    forma: null,
  })).filter(r => r.nazwa);
  console.log(`     ✅ Tabela: ${tabela.length} drużyn`);
  return { tabela, liga: data?.league_name || null };
}

async function scrapeListaMeczow(page) {
  console.log('  📋 Pobieram terminarz...');
  const data = await fetchJson(page, `/api-proxy/fixtures/${LEAGUE_ID}`);
  const games = (data?.games || []).filter(g => isDrawa(g.hostName) || isDrawa(g.guestName));
  console.log(`     ✅ Znaleziono: ${games.length} meczów Drawy`);
  return games;
}

async function scrapeMeczSzczegoly(page, gameId) {
  const detail = await fetchJson(page, `/api-proxy/match_detail/${gameId}`);
  if (!detail || detail.message) return null;

  const wszystkieZdarzenia = buildZdarzenia(detail.events);
  const strzelcy = wszystkieZdarzenia.filter(z => z.typ === 'gol' || z.typ === 'samobójczy');
  const kartki = wszystkieZdarzenia.filter(z => z.typ.includes('kartka') || z.typ.includes('żółto'));
  const zmiany = wszystkieZdarzenia.filter(z => z.typ === 'zmiana');

  const gospodarze = parseTeamSquad(detail.hsquad);
  const goscie = parseTeamSquad(detail.asquad);
  const sklady = (gospodarze || goscie) ? { gospodarze, goscie } : null;

  return { wszystkieZdarzenia, strzelcy, kartki, zmiany, sklady, liga: detail.league_name || null };
}

(async () => {
  ensureTmp();
  console.log('🚀 Drawa Drawno scraper (ZZPN) — start\n');
  writeStatus({ status: 'running', startedAt: new Date().toISOString(), progress: 'Start...' });

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'] });
  // UWAGA: bez podmiany UA backend zzpn.pl wykrywa HeadlessChrome w stringu
  // i odsyła atrapę danych (same "-1") zamiast prawdziwego JSON-a.
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'pl-PL', viewport: { width: 1280, height: 900 },
  });

  const result = { scraped_at: new Date().toISOString(), club: DRAWA_TEAM_NAME, source: 'zzpn.pl', tabela: [], mecze: [], errors: [] };

  const page = await openPage(context, `${BASE}/league/${LEAGUE_ID}/fixtures`);

  let liga = null;
  try {
    writeStatus({ status: 'running', startedAt: new Date().toISOString(), progress: 'Pobieranie tabeli...' });
    const t = await scrapeTabelaILiga(page);
    result.tabela = t.tabela;
    liga = t.liga;
  } catch (e) {
    console.error('❌ Tabela:', e.message);
    result.errors.push({ section: 'tabela', error: e.message });
  }

  let games = [];
  try {
    writeStatus({ status: 'running', startedAt: new Date().toISOString(), progress: 'Pobieranie terminarza...' });
    games = await scrapeListaMeczow(page);
  } catch (e) {
    console.error('❌ Terminarz:', e.message);
    result.errors.push({ section: 'lista_meczow', error: e.message });
  }

  console.log(`\n  ⚽ Przetwarzam ${games.length} meczów Drawy...\n`);
  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    writeStatus({ status: 'running', startedAt: new Date().toISOString(), progress: `Mecz ${i + 1}/${games.length}: ${g.hostName} vs ${g.guestName}` });
    process.stdout.write(`     [${i + 1}/${games.length}] ${g.hostName} vs ${g.guestName}... `);

    const scoreValid = typeof g.scoresFinal === 'string' && /^\d+:\d+$/.test(g.scoresFinal);
    const walkower = g.state === 'Rozegrany' && g.scoresFinal && !scoreValid;
    const mecz = {
      id: g.id,
      url: `${BASE}/match/${g.id}`,
      liga,
      team1: g.hostName,
      team2: g.guestName,
      herb1: g.hostLogo || null,
      herb2: g.guestLogo || null,
      score: g.state === 'Rozegrany' && scoreValid ? g.scoresFinal : null,
      komentarz: walkower ? g.scoresFinal : null,
      walkower,
      date: formatDate(g.date, g.time),
      status: g.state === 'Rozegrany' ? (walkower ? 'walkower' : 'koniec') : 'planowany',
    };

    if (g.state === 'Rozegrany' && !walkower) {
      try {
        const detail = await scrapeMeczSzczegoly(page, g.id);
        if (detail) {
          if (detail.liga) mecz.liga = detail.liga;
          mecz.wszystkieZdarzenia = detail.wszystkieZdarzenia;
          mecz.strzelcy = detail.strzelcy;
          mecz.kartki = detail.kartki;
          mecz.zmiany = detail.zmiany;
          if (detail.sklady) mecz.sklady = detail.sklady;
        }
        console.log(`✅ ${mecz.score} | ${mecz.wszystkieZdarzenia?.length || 0} zdarzeń`);
      } catch (e) {
        console.log(`❌ ${e.message}`);
        result.errors.push({ section: `mecz_${g.id}`, error: e.message });
      }
    } else {
      console.log(walkower ? '⚠️  walkower' : '· planowany');
    }

    result.mecze.push(mecz);
    await sleep(400 + Math.random() * 300);
  }

  await browser.close();

  const outputPath = path.join(TMP_DIR, 'scraper_output.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

  const stats = { tabela: result.tabela.length, mecze: result.mecze.length, scraped_at: result.scraped_at };
  writeStatus({ status: 'done', finishedAt: new Date().toISOString(), progress: 'Gotowe!', stats });

  console.log(`\n✅ Gotowe! Tabela: ${result.tabela.length} drużyn, Mecze: ${result.mecze.length}`);
  console.log(`   Wynik: ${outputPath}`);
})();

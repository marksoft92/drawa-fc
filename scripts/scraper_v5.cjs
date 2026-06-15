/**
 * Drawa Drawno — RegioWyniki scraper v5
 *
 * Instalacja:
 *   npm install playwright
 *   npx playwright install chromium
 *
 * Uruchomienie:
 *   node scripts/scraper_v5.cjs
 *
 * Wynik: tmp/scraper_output.json
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const BASE = 'https://regiowyniki.pl';
const DRAWA_TEAM_NAME = 'Drawa Drawno';
const ROOT = path.join(__dirname, '..');
const TMP_DIR = path.join(ROOT, 'tmp');

const URLS = {
  lista:  `${BASE}/druzyna/Pilka_Nozna/Zachodniopomorskie/Drawa_Drawno/zachodniopomorska_IV/`,
  tabela: `${BASE}/druzyna/Pilka_Nozna/Zachodniopomorskie/Drawa_Drawno/zachodniopomorska_IV/tabela/`,
  kadra:  `${BASE}/druzyna/Pilka_Nozna/Zachodniopomorskie/Drawa_Drawno/zachodniopomorska_IV/kadra/`,
};

function ensureTmp() {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
}

function writeStatus(data) {
  ensureTmp();
  fs.writeFileSync(path.join(TMP_DIR, 'scraper_status.json'), JSON.stringify(data, null, 2));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function openPage(context, url) {
  const page = await context.newPage();
  await page.route('**/{gtm,analytics,hotjar,doubleclick,googlesyndication,facebook.net}**', r => r.abort());
  await page.route('**/*.{woff,woff2,ttf,mp4,mp3}', r => r.abort());
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(3000);
  return page;
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => { fs.unlink(destPath, () => {}); reject(err); });
  });
}

function safeFilename(name) {
  return name.replace(/[^\w\-. ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, '_').trim().substring(0, 80);
}

function cleanPlayerName(raw) {
  if (!raw) return null;
  return raw
    .replace(/^\([^)]*\)\s*/g, '')
    .replace(/\s*\([^)]*\)/g, '')
    .trim();
}

async function scrapeListaMeczow(context) {
  console.log('  📋 Pobieram listę meczów...');
  const page = await openPage(context, URLS.lista);

  const dane = await page.evaluate(() => {
    const mecze = [];
    const container = document.querySelector('div.matcheslist');
    if (!container) return mecze;

    let currentLiga = null;
    [...container.children].forEach(el => {
      if (el.tagName === 'H4') { currentLiga = el.innerText.trim(); return; }
      if (el.tagName !== 'UL') return;

      [...el.querySelectorAll('li.list-group-item')].forEach(li => {
        const dateCol = li.querySelector('.date');
        const dayEl = dateCol?.querySelector('.col-xs-7');
        const timeEl = dateCol?.querySelector('.col-xs-5');
        const dateRaw = `${dayEl?.innerText?.trim() || ''} ${timeEl?.innerText?.trim() || ''}`.trim();

        const teamEls = li.querySelectorAll('.team');
        const team1 = [...teamEls].find(t => t.classList.contains('text-right'))?.innerText?.trim() || '';
        const team2 = [...teamEls].find(t => !t.classList.contains('text-right'))?.innerText?.trim() || '';

        const goalEls = li.querySelectorAll('.goals.digits');
        const gole1 = goalEls[0]?.innerText?.trim() || '-';
        const gole2 = goalEls[1]?.innerText?.trim() || '-';
        const score = (gole1 !== '-' && gole2 !== '-') ? `${gole1}:${gole2}` : null;

        const komentarzEl = li.querySelector('.comment');
        const komentarz = komentarzEl?.innerText?.trim() || null;
        const walkower = komentarz?.toLowerCase().includes('walkower') || false;

        const linkEl = li.querySelector('a[href*="/mecz/"]');
        const url = linkEl ? linkEl.href : null;
        const idMatch = url?.match(/\/mecz\/(\d+)\//);
        const id = idMatch ? idMatch[1] : null;

        const imgs = [...li.querySelectorAll('img[src*="/flags/"]')];
        const herb1 = imgs[0] ? (imgs[0].src.startsWith('//') ? 'https:' + imgs[0].src : imgs[0].src) : null;
        const herb2 = imgs[1] ? (imgs[1].src.startsWith('//') ? 'https:' + imgs[1].src : imgs[1].src) : null;

        mecze.push({ id, url, liga: currentLiga, team1, team2, score, komentarz, walkower, date: dateRaw, herb1, herb2 });
      });
    });
    return mecze;
  });

  await page.close();
  console.log(`     ✅ Znaleziono: ${dane.length} meczów`);
  return dane;
}

async function scrapeMecz(context, meczMeta) {
  const page = await openPage(context, meczMeta.url);

  const data = await page.evaluate(() => {
    const zdarzenia = [];
    const eventsTable = document.querySelector('#events table');

    if (eventsTable) {
      const rows = [...eventsTable.querySelectorAll('tbody tr')];
      rows.forEach(tr => {
        if (tr.querySelector('td.status')) return;

        const leftTd = tr.querySelector('td.left');
        const rightTd = tr.querySelector('td.right');
        const centerTd = tr.querySelector('td.center');
        const aktualnyWynik = centerTd?.innerText?.trim() || null;

        const parseStrona = (td, strona) => {
          if (!td || !td.innerText.trim() || td.innerText.trim() === ' ') return;
          const allTexts = td.innerText;
          const minutaMatch = allTexts.match(/'(\d{1,3}\+?\d*)/);
          const minuta = minutaMatch ? minutaMatch[1] : null;
          const detailsEl = td.querySelector('.details');
          const zawodnikRaw = detailsEl?.innerText?.replace(/\s+/g, ' ').trim() || null;
          const imagemap = td.querySelector('.imagemap');
          let typ = 'nieznany';
          if (imagemap) {
            const cls = imagemap.className;
            if (cls.includes('suicide')) typ = 'samobójczy';
            else if (cls.includes('goal')) typ = 'gol';
            else if (cls.includes('yellow') && cls.includes('red')) typ = 'żółto-czerwona';
            else if (cls.includes('yellow')) typ = 'żółta kartka';
            else if (cls.includes('red')) typ = 'czerwona kartka';
            else if (cls.includes('change') || cls.includes('chg')) typ = 'zmiana';
          }
          if (typ === 'nieznany' && zawodnikRaw && /br\.\s*samob/i.test(zawodnikRaw)) typ = 'samobójczy';
          if (minuta || zawodnikRaw) zdarzenia.push({ minuta, zawodnikRaw, typ, strona, wynik_po: aktualnyWynik });
        };

        parseStrona(leftTd, 'gospodarze');
        parseStrona(rightTd, 'goscie');
      });
    }

    const timeEl = document.querySelector('time[itemprop="startDate"]');
    const breadcrumbs = [...document.querySelectorAll('ul.breadcrumbs li a')];
    const liga = breadcrumbs.map(a => a.innerText.trim()).filter(t =>
      t.includes('Klasa') || t.includes('Liga') || t.includes('Puchar') || t.includes('IV') || t.includes('ZPN')
    ).join(' | ') || null;

    return { date: timeEl?.innerText?.trim() || null, liga, zdarzenia_raw: zdarzenia };
  });

  const wszystkieZdarzenia = data.zdarzenia_raw.map(z => ({
    minuta: z.minuta,
    zawodnik: cleanPlayerName(z.zawodnikRaw),
    typ: z.typ,
    strona: z.strona,
    wynik_po: z.wynik_po,
  }));

  const strzelcy = wszystkieZdarzenia.filter(z => z.typ === 'gol' || z.typ === 'samobójczy');
  const kartki = wszystkieZdarzenia.filter(z => z.typ.includes('kartka') || z.typ.includes('żółto'));
  const zmiany = wszystkieZdarzenia.filter(z => z.typ === 'zmiana');

  await page.close();
  return { ...meczMeta, ...data, zdarzenia_raw: undefined, strzelcy, kartki, zmiany, wszystkieZdarzenia };
}

async function scrapeSkladyMeczu(context, meczId) {
  const url = `${BASE}/ajax/matchPlayers.php?id=${meczId}&arch=1`;
  const page = await context.newPage();
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const json = await response.json();
    if (json?.ok !== 1 || !json?.map) return null;

    const parseTeam = (teamData) => {
      if (!teamData || teamData.tactics === 9) return null;
      const players = Object.values(teamData.players || {});
      if (players.length === 0) return null;
      const pierwsza11 = [], rezerwa = [];
      for (const plr of players) {
        if (!plr.id || plr.id === 0) continue;
        const zawodnik = {
          id: plr.id, nazwisko: plr.name, numer: plr.nr > 0 ? plr.nr : null,
          gole_w_meczu: plr.flags?.G || 0, samobojcze_w_meczu: plr.flags?.S || 0,
          kartka_w_meczu: [null,'żółta','żółto-czerwona','czerwona','żółta+czerwona'][plr.flags?.C] ?? null,
          zmiana_w_meczu: [null,'zszedł','wszedł','wszedł_i_zszedł'][plr.flags?.T] ?? null,
        };
        if (plr.pos >= 90) rezerwa.push(zawodnik); else pierwsza11.push(zawodnik);
      }
      return { pierwsza11, rezerwa, ustawienie: teamData.tactics || null };
    };

    const wynik = { gospodarze: parseTeam(json.map[1]), goscie: parseTeam(json.map[2]) };
    if (!wynik.gospodarze && !wynik.goscie) return null;
    return wynik;
  } catch { return null; }
  finally { await page.close(); }
}

async function scrapeTabela(context) {
  console.log('  📊 Pobieram tabelę ligową...');
  const page = await openPage(context, URLS.tabela);
  const tabela = await page.evaluate(() => {
    const container = document.querySelector('#tabletotal ul.list-group.grouptable');
    if (!container) return [];
    return [...container.querySelectorAll('li.list-group-item.tablegroupteam')].map(li => {
      const pozycja = li.querySelector('.nr')?.innerText?.trim() || null;
      const nazwa = li.querySelector('a.xhidden-xs')?.innerText?.trim() || null;
      const herbImg = li.querySelector('img[src*="/flags/"]');
      const herb = herbImg ? (herbImg.src.startsWith('//') ? 'https:' + herbImg.src : herbImg.src) : null;
      const cols = [...li.querySelectorAll('.col-xs-1, .col-xs-3.col-sm-1')].map(c => c.innerText.trim());
      const liczby = cols.map(c => c.replace(/[^\d:+\-]/g, '')).filter(Boolean);
      const bramkiEl = li.querySelector('.col-xs-3.col-sm-1.col-lg-1, .col-xs-3.col-sm-1');
      const bramki = bramkiEl?.innerText?.trim() || null;
      const formaEls = [...li.querySelectorAll('.formtypeW, .formtypeL, .formtypeD, .formtypeN')];
      const forma = formaEls.map(el => {
        const cls = el.className;
        if (cls.includes('formtypeW')) return 'W';
        if (cls.includes('formtypeL')) return 'P';
        if (cls.includes('formtypeD')) return 'R';
        return '?';
      }).join('');
      return { pozycja, nazwa, herb, pkt: liczby[0], mecze: liczby[1], wygrane: liczby[2], remisy: liczby[3], przegrane: liczby[4], bramki, forma };
    }).filter(r => r.nazwa);
  });
  await page.close();
  console.log(`     ✅ Tabela: ${tabela.length} drużyn`);
  return tabela;
}

(async () => {
  ensureTmp();
  console.log('🚀 Drawa Drawno scraper v5 — start\n');
  writeStatus({ status: 'running', startedAt: new Date().toISOString(), progress: 'Start...' });

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
    locale: 'pl-PL', viewport: { width: 1280, height: 900 },
  });

  const result = { scraped_at: new Date().toISOString(), club: DRAWA_TEAM_NAME, source: 'regiowyniki.pl', tabela: [], mecze: [], errors: [] };

  try {
    writeStatus({ status: 'running', startedAt: new Date().toISOString(), progress: 'Pobieranie tabeli...' });
    result.tabela = await scrapeTabela(context);
  } catch (e) {
    console.error('❌ Tabela:', e.message);
    result.errors.push({ section: 'tabela', error: e.message });
  }

  let listaMeczow = [];
  try {
    writeStatus({ status: 'running', startedAt: new Date().toISOString(), progress: 'Pobieranie listy meczów...' });
    listaMeczow = await scrapeListaMeczow(context);
  } catch (e) {
    console.error('❌ Lista meczów:', e.message);
    result.errors.push({ section: 'lista_meczow', error: e.message });
  }

  for (const m of listaMeczow.filter(m => !m.url)) {
    const status = m.walkower ? 'walkower' : m.score !== null ? 'koniec' : 'planowany';
    result.mecze.push({ ...m, status });
  }

  const doPobrania = listaMeczow.filter(m => m.url);
  if (doPobrania.length > 0) {
    console.log(`\n  ⚽ Pobieram szczegóły ${doPobrania.length} meczów...\n`);
    for (let i = 0; i < doPobrania.length; i++) {
      const m = doPobrania[i];
      writeStatus({ status: 'running', startedAt: new Date().toISOString(), progress: `Mecz ${i+1}/${doPobrania.length}: ${m.team1} vs ${m.team2}` });
      process.stdout.write(`     [${i+1}/${doPobrania.length}] ${m.team1} vs ${m.team2}... `);
      try {
        const detail = await scrapeMecz(context, m);
        const sklady = await scrapeSkladyMeczu(context, m.id);
        if (sklady) detail.sklady = sklady;
        result.mecze.push({ ...detail, status: detail.status || 'koniec' });
        console.log(`✅ ${detail.score || m.score} | ${detail.wszystkieZdarzenia?.length || 0} zdarzeń`);
      } catch (e) {
        console.log(`❌ ${e.message}`);
        result.mecze.push({ ...m, status: 'koniec', error: e.message });
      }
      await sleep(600 + Math.random() * 400);
    }
  }

  await browser.close();

  const outputPath = path.join(TMP_DIR, 'scraper_output.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

  const stats = { tabela: result.tabela.length, mecze: result.mecze.length, scraped_at: result.scraped_at };
  writeStatus({ status: 'done', finishedAt: new Date().toISOString(), progress: 'Gotowe!', stats });

  console.log(`\n✅ Gotowe! Tabela: ${result.tabela.length} drużyn, Mecze: ${result.mecze.length}`);
  console.log(`   Wynik: ${outputPath}`);
})();

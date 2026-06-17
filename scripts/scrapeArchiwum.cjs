const https = require('https');
const http = require('http');
const { load } = require('cheerio');
const fs = require('fs');
const path = require('path');
const { Buffer } = require('buffer');

const SEASON_IDS = [
  19, 84, 155, 211, 250, 309, 343, 397, 424, 509,
  777, 901, 998, 1096, 1132, 1202, 1226, 1289, 1317,
  1344, 1362, 1416, 1425, 1440,
];

const BASE = 'http://ligowiec.net/klub/drawadrawno/archiwum/';
const DELAY = 1500;

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const opts = { headers: { 'User-Agent': 'Mozilla/5.0' } };
    proto.get(url, opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const decoded = buf.toString('latin1')
          .replace(/[\x80-\xFF]/g, (ch) => {
            const map = {
              '\xB3': 'ł', '\xA3': 'Ł', '\xE6': 'ć', '\xC6': 'Ć',
              '\xEA': 'ę', '\xCA': 'Ę', '\xF1': 'ń', '\xD1': 'Ń',
              '\xF3': 'ó', '\xD3': 'Ó', '\xB6': 'ś', '\xA6': 'Ś',
              '\xBF': 'ż', '\xAF': 'Ż', '\xBC': 'ź', '\xAC': 'Ź',
              '\xB9': 'ą', '\xA1': 'Ą',
              '\xB1': 'ą', '\xE1': 'ą',
              '\xF0': 'đ', '\xB2': 'ł',
            };
            return map[ch] || ch;
          });
        resolve(decoded);
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parsePage(html) {
  const $ = load(html);

  const titleEl = $('title').text();
  const seasonMatch = titleEl.match(/w\s+(.+?)\s+w portalu/);
  const leagueSeason = seasonMatch ? seasonMatch[1].trim() : titleEl;

  const sezonMatch = leagueSeason.match(/\((\d{4}\/\d{4})\)/);
  const sezon = sezonMatch ? sezonMatch[1] : null;
  const liga = leagueSeason.replace(/\s*\(\d{4}\/\d{4}\)\s*/, '').trim();

  const mecze = [];
  const mainTable = $('table.tabela').first();
  let kolejka = null;

  mainTable.find('tr').each((_, tr) => {
    const tds = $(tr).find('td');
    const text = $(tr).text().trim();

    const kolejkaMatch = text.match(/^(\d+)\s*kolejka$/);
    if (kolejkaMatch) {
      kolejka = parseInt(kolejkaMatch[1]);
      return;
    }

    if (tds.length >= 3) {
      const dateText = tds.eq(0).text().trim();
      const scoreLink = tds.eq(1).find('a');
      const scoreText = tds.eq(1).text().replace(/\s/g, '').trim();
      const teamsText = tds.eq(2).text().trim();

      if (teamsText.includes(' - ') && scoreText.match(/\d+:\d+/)) {
        const parts = teamsText.split(' - ').map((s) => s.trim());
        mecze.push({
          kolejka,
          date: dateText,
          team1: parts[0],
          team2: parts.slice(1).join(' - '),
          score: scoreText,
        });
      }
    }
  });

  const tabela = [];
  $('table.tabela').each((_, table) => {
    $(table).find('tr').each((_, tr) => {
      const tds = $(tr).find('td');
      if (tds.length >= 8) {
        const pos = tds.eq(0).text().replace(/[^0-9]/g, '');
        const name = tds.eq(1).text().trim();
        const m = tds.eq(2).text().trim();
        const pkt = tds.eq(3).text().trim();
        const w = tds.eq(4).text().trim();
        const r = tds.eq(5).text().trim();
        const p = tds.eq(6).text().trim();
        const goals = tds.eq(7).text().replace(/\s/g, '').trim();

        if (pos && name && !name.includes('Klasa') && !name.includes('Liga')) {
          tabela.push({
            pozycja: parseInt(pos),
            nazwa: name,
            mecze: parseInt(m) || 0,
            pkt: parseInt(pkt) || 0,
            wygrane: parseInt(w) || 0,
            remisy: parseInt(r) || 0,
            przegrane: parseInt(p) || 0,
            bramki: goals,
          });
        }
      }
    });
  });

  return { liga, sezon, mecze, tabela };
}

async function main() {
  const results = [];
  console.log(`\n⚽ Scraper archiwum Drawa Drawno — ${SEASON_IDS.length} sezonów\n`);

  for (let i = 0; i < SEASON_IDS.length; i++) {
    const id = SEASON_IDS[i];
    const url = BASE + id;
    process.stdout.write(`[${i + 1}/${SEASON_IDS.length}] ID ${id}... `);

    try {
      const html = await fetchPage(url);
      const data = parsePage(html);
      data.sourceId = id;
      data.sourceUrl = url;
      results.push(data);
      console.log(`✅ ${data.liga} ${data.sezon || '?'} — ${data.mecze.length} meczów, ${data.tabela.length} drużyn`);
    } catch (e) {
      console.log(`❌ ${e.message}`);
      results.push({ sourceId: id, sourceUrl: url, error: e.message });
    }

    if (i < SEASON_IDS.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY));
    }
  }

  const outDir = path.join(__dirname, '..', 'tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'archiwum_ligowiec.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log(`\n✅ Gotowe! Zapisano ${results.length} sezonów → ${outPath}`);
  const totalMecze = results.reduce((sum, r) => sum + (r.mecze?.length || 0), 0);
  console.log(`   Łącznie: ${totalMecze} meczów\n`);
}

main().catch(console.error);

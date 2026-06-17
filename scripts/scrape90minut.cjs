const http = require('http');
const { load } = require('cheerio');
const fs = require('fs');
const path = require('path');

const PAGES = [
  { id: 656, url: 'http://www.90minut.pl/liga/0/liga656.html' },
  { id: 758, url: 'http://www.90minut.pl/liga/0/liga758.html' },
  { id: 747, url: 'http://www.90minut.pl/liga/0/liga747.html' },
  { id: 1730, url: 'http://www.90minut.pl/liga/0/liga1730.html' },
  { id: 1352, url: 'http://www.90minut.pl/liga/0/liga1352.html' },
  { id: 1969, url: 'http://www.90minut.pl/liga/0/liga1969.html' },
  { id: 1991, url: 'http://www.90minut.pl/liga/0/liga1991.html' },
  { id: 2600, url: 'http://www.90minut.pl/liga/0/liga2600.html', tabelaOnly: true },
  { id: 3219, url: 'http://www.90minut.pl/liga/0/liga3219.html', tabelaOnly: true },
];

const DELAY = 1500;

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    http.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const text = buf.toString('latin1')
          .replace(/[\x80-\xFF]/g, (ch) => {
            const map = {
              '\xB3': 'ł', '\xA3': 'Ł', '\xE6': 'ć', '\xC6': 'Ć',
              '\xEA': 'ę', '\xCA': 'Ę', '\xF1': 'ń', '\xD1': 'Ń',
              '\xF3': 'ó', '\xD3': 'Ó', '\xB6': 'ś', '\xA6': 'Ś',
              '\xBF': 'ż', '\xAF': 'Ż', '\xBC': 'ź', '\xAC': 'Ź',
              '\xB9': 'ą', '\xA1': 'Ą', '\xB1': 'ą', '\xE1': 'ą',
              '\xF4': 'ô', '\xEB': 'ë',
            };
            return map[ch] || ch;
          });
        resolve(text);
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parsePage(html) {
  const $ = load(html);

  const title = $('title').text().trim();
  const sezonMatch = title.match(/(\d{4}\/\d{4})/);
  const sezon = sezonMatch ? sezonMatch[1] : null;
  const liga = title.replace(/,\s*grupa:.*$/, '').replace(/\s*\d{4}\/\d{4}/, '').trim();

  const tabela = [];
  $('table.main2 tr').each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length >= 8) {
      const posText = tds.eq(0).text().replace(/[^0-9]/g, '');
      const pos = parseInt(posText);
      if (!pos || pos > 50) return;
      const nazwa = tds.eq(1).text().trim().replace(/^\s+/, '');
      if (!nazwa || nazwa === 'Nazwa') return;
      const m = parseInt(tds.eq(2).text()) || 0;
      const pkt = parseInt(tds.eq(3).text()) || 0;
      const w = parseInt(tds.eq(4).text()) || 0;
      const r = parseInt(tds.eq(5).text()) || 0;
      const p = parseInt(tds.eq(6).text()) || 0;
      const bramki = tds.eq(7).text().trim();
      if (tabela.find(t => t.nazwa === nazwa)) return;
      tabela.push({ pozycja: pos, nazwa, mecze: m, pkt, wygrane: w, remisy: r, przegrane: p, bramki });
    }
  });

  const mecze = [];
  let kolejka = null;

  $('table.main').each((_, table) => {
    const headerText = $(table).text().trim();
    const kolMatch = headerText.match(/Kolejka\s+(\d+)/i);
    if (kolMatch) {
      kolejka = parseInt(kolMatch[1]);
      return;
    }

    $(table).find('tr').each((_, tr) => {
      const tds = $(tr).find('td');
      if (tds.length >= 3) {
        const team1 = tds.eq(0).text().trim();
        const score = tds.eq(1).text().trim();
        const team2 = tds.eq(2).text().trim();
        if (team1 && team2 && /^\d+-\d+$/.test(score) &&
            (team1.toLowerCase().includes('drawa drawno') || team2.toLowerCase().includes('drawa drawno'))) {
          mecze.push({
            kolejka,
            date: null,
            team1,
            team2,
            score: score.replace('-', ':'),
          });
        }
      }
    });
  });

  return { liga, sezon, mecze, tabela };
}

async function main() {
  const results = [];
  console.log(`\n⚽ Scraper 90minut.pl — ${PAGES.length} stron\n`);

  for (let i = 0; i < PAGES.length; i++) {
    const { id, url } = PAGES[i];
    process.stdout.write(`[${i + 1}/${PAGES.length}] liga${id}... `);
    try {
      const html = await fetchPage(url);
      const data = parsePage(html);
      data.sourceId = 90000 + id;
      data.sourceUrl = url;
      results.push(data);
      console.log(`✅ ${data.liga} ${data.sezon || '?'} — ${data.mecze.length} meczów Drawy, ${data.tabela.length} w tabeli`);
    } catch (e) {
      console.log(`❌ ${e.message}`);
    }
    if (i < PAGES.length - 1) await new Promise((r) => setTimeout(r, DELAY));
  }

  const outPath = path.join(__dirname, '..', 'tmp', 'archiwum_90minut.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
  const totalMecze = results.reduce((sum, r) => sum + (r.mecze?.length || 0), 0);
  console.log(`\n✅ Gotowe! ${results.length} sezonów, ${totalMecze} meczów → ${outPath}\n`);
}

main().catch(console.error);

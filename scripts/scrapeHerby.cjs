const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PAGES = [
  'http://regiowyniki.pl/kalendarz/Pilka_Nozna/2021/2022/Zachodniopomorskie/Klasa_okregowa/zachodniopomorska_IV/',
  'http://regiowyniki.pl/kalendarz/Pilka_Nozna/2020/2021/Zachodniopomorskie/Klasa_okregowa/zachodniopomorska_IV/',
  'http://regiowyniki.pl/kalendarz/Pilka_Nozna/2019/2020/Zachodniopomorskie/Klasa_okregowa/zachodniopomorska_II/',
  'http://regiowyniki.pl/kalendarz/Pilka_Nozna/2018/2019/Zachodniopomorskie/Klasa_A/zachodniopomorska_V/',
  'http://regiowyniki.pl/kalendarz/Pilka_Nozna/2017/2018/Zachodniopomorskie/Klasa_okregowa/zachodniopomorska_IV/',
  'http://regiowyniki.pl/kalendarz/Pilka_Nozna/2016/2017/Zachodniopomorskie/Klasa_A/zachodniopomorska_V/',
  'http://regiowyniki.pl/kalendarz/Pilka_Nozna/2015/2016/Zachodniopomorskie/Klasa_B/zachodniopomorska_IV/',
  'http://regiowyniki.pl/kalendarz/Pilka_Nozna/2014/2015/Zachodniopomorskie/Klasa_B/zachodniopomorska_IV/',
  // starsze z druzyna pages
  'http://regiowyniki.pl/druzyna/Pilka_Nozna/Zachodniopomorskie/Drawa_Drawno/zachodniopomorska_IV/',
  // A klasa grupy z drawą
  'http://regiowyniki.pl/kalendarz/Pilka_Nozna/2025/2026/Zachodniopomorskie/Klasa_B/zachodniopomorska_IV/',
];

const DELAY = 1500;
const OUT_DIR = path.join(__dirname, '..', 'public', 'herby');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (url.startsWith('//')) url = 'https:' + url;
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (e) => { fs.unlink(dest, () => {}); reject(e); });
  });
}

function slugify(name) {
  return name.toLowerCase()
    .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e').replace(/ł/g,'l')
    .replace(/ń/g,'n').replace(/ó/g,'o').replace(/ś/g,'s').replace(/ź/g,'z').replace(/ż/g,'z')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const herbs = new Map(); // slug -> { name, flagUrl }

  console.log(`\n🏆 Scraper herbów — ${PAGES.length} stron\n`);

  for (let i = 0; i < PAGES.length; i++) {
    const url = PAGES[i];
    process.stdout.write(`[${i+1}/${PAGES.length}] ${url.split('/').slice(-2, -1)[0]}... `);
    try {
      const html = await fetchPage(url);
      const regex = /(?:\/\/static\.regiowyniki\.pl|)\/static\/flags\/(\d+)\.jpg"[^>]*alt="([^"]+)"/g;
      let match;
      let count = 0;
      while ((match = regex.exec(html)) !== null) {
        const flagId = match[1];
        const name = match[2].trim();
        if (!name || name === '0' || flagId === '0') continue;
        const slug = slugify(name);
        if (!herbs.has(slug)) {
          herbs.set(slug, { name, flagId, flagUrl: `https://static.regiowyniki.pl/flags/${flagId}.jpg` });
          count++;
        }
      }
      console.log(`✅ +${count} nowych (razem: ${herbs.size})`);
    } catch (e) {
      console.log(`❌ ${e.message}`);
    }
    if (i < PAGES.length - 1) await new Promise(r => setTimeout(r, DELAY));
  }

  console.log(`\n📥 Pobieranie ${herbs.size} herbów...\n`);

  let downloaded = 0, skipped = 0;
  for (const [slug, data] of herbs) {
    const dest = path.join(OUT_DIR, `${slug}.jpg`);
    if (fs.existsSync(dest)) { skipped++; continue; }
    try {
      await downloadFile(data.flagUrl, dest);
      downloaded++;
      if (downloaded % 10 === 0) process.stdout.write(`  ${downloaded}...`);
    } catch (e) {
      console.log(`  ❌ ${slug}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  // Save mapping JSON
  const mapping = {};
  for (const [slug, data] of herbs) {
    mapping[data.name] = `/herby/${slug}.jpg`;
  }
  const mapPath = path.join(__dirname, '..', 'public', 'herby', 'mapping.json');
  fs.writeFileSync(mapPath, JSON.stringify(mapping, null, 2), 'utf-8');

  console.log(`\n\n✅ Gotowe! ${herbs.size} herbów (${downloaded} pobranych, ${skipped} już było)`);
  console.log(`   Mapping: ${mapPath}\n`);
}

main().catch(console.error);

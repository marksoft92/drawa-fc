const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'public', 'herby');
const DELAY = 1200;

function slugify(name) {
  return name.toLowerCase()
    .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e').replace(/ł/g,'l')
    .replace(/ń/g,'n').replace(/ó/g,'o').replace(/ś/g,'s').replace(/ź/g,'z').replace(/ż/g,'z')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

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
  if (url.startsWith('//')) url = 'https:' + url;
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close(); fs.unlinkSync(dest);
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (e) => { fs.unlink(dest, () => {}); reject(e); });
  });
}

// Drużyny bez herba — nazwa na regiowyniki → slug
const TEAMS = [
  { name: 'Świt Barnimie', regio: 'Swit_Barnimie' },
  { name: 'Polonia Giżyn', regio: 'Polonia_Gizyn' },
  { name: 'Orkan Suchań', regio: 'Orkan_Suchan' },
  { name: 'Czcibor Cedynia', regio: 'Czcibor_Cedynia' },
  { name: 'Kłos Pełczyce', regio: 'Klos_Pelczyce' },
  { name: 'Piast Karsko', regio: 'Piast_Karsko' },
  { name: 'Myśla Dargomyśl', regio: 'Mysla_Dargomysl' },
  { name: 'Klon Krzęcin', regio: 'Klon_Krzecin' },
  { name: 'Koral Mostkowo', regio: 'Koral_Mostkowo' },
  { name: 'Trojan Strąpie', regio: 'Trojan_Strapie' },
  { name: 'Korona Raduń', regio: 'Korona_Radun' },
  { name: 'Błękitni Sarnik', regio: 'Blekitni_Sarnik' },
  { name: 'Ina Nadarzyn', regio: 'Ina_Nadarzyn' },
  { name: 'Remor Recz', regio: 'Remor_Recz' },
  { name: 'Iskra Warszyn', regio: 'Iskra_Warszyn' },
  { name: 'Unia Dolice', regio: 'Unia_Dolice' },
  { name: 'Energetyk Gryfino', regio: 'Energetyk_Gryfino' },
  { name: 'Odra Chojna', regio: 'Odra_Chojna' },
  { name: 'Sokół Pyrzyce', regio: 'Sokol_Pyrzyce' },
  { name: 'Stal Lipiany', regio: 'Stal_Lipiany' },
  { name: 'Dąb Dębno', regio: 'Dab_Debno' },
  { name: 'Osadnik Myślibórz', regio: 'Osadnik_Mysliborz' },
  { name: 'Biali Sądów', regio: 'Biali_Sadow' },
  { name: 'Morzycko Moryń', regio: 'Morzycko_Moryn' },
  { name: 'Iskra Banie', regio: 'Iskra_Banie' },
  { name: 'Orzeł Pęzino', regio: 'Orzel_Pezino' },
  { name: 'Orzeł Trzcińsko-Zdrój', regio: 'Orzel_Trzcinsko-Zdroj' },
  { name: 'Ogniwo Babinek', regio: 'Ogniwo_Babinek' },
  { name: 'Mieszko Mieszkowice', regio: 'Mieszko_Mieszkowice' },
  { name: 'Zieloni Zielin', regio: 'Zieloni_Zielin' },
  { name: 'Sęp Brzesko', regio: 'Sep_Brzesko' },
  { name: 'SCRS Barlinek', regio: 'SCRS_Barlinek' },
  { name: 'Saturn Szadzko', regio: 'Saturn_Szadzko' },
  { name: 'Sokół Sokoliniec', regio: 'Sokol_Sokoliniec' },
  { name: 'Gryf Objezierze', regio: 'Gryf_Objezierze' },
  { name: 'Jedność Przewłoki', regio: 'Jednosc_Przewloki' },
  { name: 'Gwiazda Żalęcino', regio: 'Gwiazda_Zalecino' },
  { name: 'Pionier Zwierzyn', regio: 'Pionier_Zwierzyn' },
  { name: 'Iskierka Szczecin', regio: 'Iskierka_Szczecin' },
  { name: 'Wicher Przelewice', regio: 'Wicher_Przelewice' },
  { name: 'Czarni Lubanowo', regio: 'Czarni_Lubanowo' },
  { name: 'Błękit Pniewo', regio: 'Blekit_Pniewo' },
  { name: 'Pomorzanka Jarosławsko', regio: 'Pomorzanka_Jaroslawsko' },
  { name: 'Sokół Sokoliniec', regio: 'Sokol_Sokoliniec' },
  { name: 'Kłos II Pełczyce', regio: 'Klos_II_Pelczyce' },
  { name: 'AP Gavia II Choszczno', regio: 'AP_Gavia_II_Choszczno' },
  { name: 'Skrzydlaci Będargowo', regio: 'Skrzydlaci_Bedargowo' },
  { name: 'Strzała Płotno', regio: 'Strzala_Plotno' },
];

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const toFind = TEAMS.filter(t => !fs.existsSync(path.join(OUT_DIR, `${slugify(t.name)}.jpg`)));
  console.log(`\n🏆 Szukam herbów ${toFind.length} drużyn na regiowyniki.pl\n`);

  let found = 0;
  for (let i = 0; i < toFind.length; i++) {
    const t = toFind[i];
    const slug = slugify(t.name);
    process.stdout.write(`[${i+1}/${toFind.length}] ${t.name}... `);

    try {
      const url = `http://regiowyniki.pl/druzyna/Pilka_Nozna/Zachodniopomorskie/${t.regio}/`;
      const html = await fetchPage(url);
      const match = html.match(/\/\/static\.regiowyniki\.pl\/flags\/(\d+)\.jpg/);
      if (match && match[1] !== '0') {
        const flagUrl = `https://static.regiowyniki.pl/flags/${match[1]}.jpg`;
        const dest = path.join(OUT_DIR, `${slug}.jpg`);
        await downloadFile(flagUrl, dest);
        console.log(`✅ flag ${match[1]}`);
        found++;
      } else {
        console.log(`— brak herba`);
      }
    } catch (e) {
      console.log(`❌ ${e.message}`);
    }
    await new Promise(r => setTimeout(r, DELAY));
  }

  // Update mapping.json
  const mapping = {};
  const files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.jpg'));
  for (const f of files) {
    const slug = f.replace('.jpg', '');
    mapping[slug] = `/herby/${f}`;
  }
  fs.writeFileSync(path.join(OUT_DIR, 'mapping.json'), JSON.stringify(mapping, null, 2));

  console.log(`\n✅ Gotowe! Znaleziono ${found} nowych herbów (łącznie: ${files.length})\n`);
}

main().catch(console.error);

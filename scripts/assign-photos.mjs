import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GALERIA = path.join(ROOT, 'public/galeria');
const ARTICLES = path.join(ROOT, 'content/aktualnosci');

// ── Wczytaj wszystkie zdjęcia z folderów galerii ──────────────

function getPhotos(folder) {
  const dir = path.join(GALERIA, folder);
  return fs.readdirSync(dir)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .map(f => `/galeria/${folder}/${f}`);
}

const blysk  = getPhotos('blyskawica_kluki_2025_2026_wyjazd');   // 44
const grom   = getPhotos('grom_plonno_2025_2026_wyjazd');         // 53
const pom    = getPhotos('luks_pomorzanin_zamecin_2025_2026_domowy'); // 48
const sokol  = getPhotos('sokol_granowo_2025_2026_wyjazd');       // 32
const strz   = getPhotos('strzala_plotno_2025_2026_wyjazd');      // 39

// ── Mapowanie artykuł → folder ────────────────────────────────

const MATCH_MAP = {
  '016-blyskawica-kluki-1-5.js':     blysk,
  '020-grom-plonno-3-5.js':          grom,
  '021-pomorzanin-zamecin-11-2.js':  pom,
  '022-strzala-plotno-1-5.js':       strz,
  '026-wyjazd-do-sokol-granowo-wygrywamy-6-2.js': sokol,
};

const NONAME = [{ src: '/logo.png', caption: '' }];

// ── Generuj photos array ──────────────────────────────────────

function buildPhotosStr(photos) {
  const lines = photos.map(p => {
    const src = typeof p === 'string' ? p : p.src;
    return `    { src: '${src}', caption: '' },`;
  }).join('\n');
  return `[\n${lines}\n  ]`;
}

function thumbFrom(photos) {
  const p = photos[0];
  return typeof p === 'string' ? p : p.src;
}

// ── Aktualizuj plik artykułu ──────────────────────────────────

function updateArticle(filename, photos) {
  const filePath = path.join(ARTICLES, filename);
  let src = fs.readFileSync(filePath, 'utf8');
  const thumb = thumbFrom(photos);

  // thumbnail — zastąp cokolwiek jest (null, ścieżka, komentarz)
  src = src.replace(
    /thumbnail:\s*(?:null|'[^']*').*$/m,
    `thumbnail: '${thumb}',`
  );

  // photos array — zastąp cały blok photos: [...] do zamykającego ],
  src = src.replace(
    /photos:\s*\[[\s\S]*?\],/m,
    `photos: ${buildPhotosStr(photos)},`
  );

  fs.writeFileSync(filePath, src, 'utf8');
  console.log(`✓ ${filename} — ${photos.length} zdjęć`);
}

// ── Główna pętla ──────────────────────────────────────────────

const files = fs.readdirSync(ARTICLES).filter(f => f.match(/^\d{3}.*\.js$/));

for (const file of files) {
  if (MATCH_MAP[file]) {
    updateArticle(file, MATCH_MAP[file]);
  } else {
    updateArticle(file, NONAME);
  }
}

console.log('\nGotowe!');

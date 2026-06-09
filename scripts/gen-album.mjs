#!/usr/bin/env node
/**
 * Użycie:
 *   npm run gen-album
 *
 * Skanuje public/galeria/ i dla każdego nowego folderu
 * (bez pliku w content/galeria/) tworzy gotowy plik albumu.
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT       = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'public', 'galeria');
const CONTENT_DIR = path.join(ROOT, 'content', 'galeria');
const IMG_EXTS   = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);

// Foldery już obsłużone (po nazwie pliku w content/galeria)
const existing = new Set(
  fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.js') && f !== 'index.js')
    .map(f => f.replace(/^\d+-/, '').replace('.js', '')) // "002-strzala" → "strzala"
);

const folders = fs.readdirSync(PUBLIC_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

let created = 0;

for (const folder of folders) {
  const slug = folder.toLowerCase()
    .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e').replace(/ł/g,'l')
    .replace(/ń/g,'n').replace(/ó/g,'o').replace(/ś/g,'s').replace(/ź/g,'z').replace(/ż/g,'z')
    .replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');

  if (existing.has(slug)) {
    console.log(`⏭  ${folder} — już istnieje, pomijam`);
    continue;
  }

  const photos = fs.readdirSync(path.join(PUBLIC_DIR, folder))
    .filter(f => IMG_EXTS.has(path.extname(f).toLowerCase()))
    .sort()
    .map(f => `    { src: '/galeria/${folder}/${f}', caption: '' }`)
    .join(',\n');

  if (!photos) {
    console.log(`⚠️  ${folder} — brak zdjęć, pomijam`);
    continue;
  }

  const nextNum = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.js') && f !== 'index.js').length + 1;
  const numPad  = String(nextNum).padStart(3, '0');
  const outFile = `${numPad}-${slug}.js`;
  const title   = folder.replace(/[_-]/g, ' ');
  const varName = `g${numPad}`;

  fs.writeFileSync(path.join(CONTENT_DIR, outFile), `const album = {
  id: ${nextNum},
  slug: '${slug}',
  title: '${title}',
  date: '${new Date().toISOString().slice(0, 10)}',
  tags: [],

  thumbnail: null,

  photos: [
${photos},
  ],
};

export default album;
`);

  console.log(`\n✅  ${outFile}  (${photos.split('\n').length} zdjęć)`);
  console.log(`   → dodaj do content/galeria/index.js:`);
  console.log(`      import ${varName} from './${outFile.replace('.js', '')}';`);
  console.log(`      // i dopisz ${varName} do tablicy galeria`);
  created++;
}

if (created === 0 && folders.length > 0) {
  console.log('\nBrak nowych folderów do przetworzenia.');
}

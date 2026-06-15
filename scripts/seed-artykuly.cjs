'use strict';

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv/config');

function cuid() {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  console.log('Połączono z bazą.\n');

  const dir = path.join(__dirname, '..', 'content', 'aktualnosci');
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.js') && f !== 'index.js')
    .sort();

  for (const file of files) {
    const src = fs.readFileSync(path.join(dir, file), 'utf8');

    // Wyciągnij obiekt artykułu przez eval
    let artykul;
    try {
      const clean = src
        .replace(/^\/\/.*$/gm, '')          // usuń komentarze jednoliniowe
        .replace(/export default artykul;?/, '')
        .replace(/const artykul =/, 'artykul =');
      const fn = new Function('let artykul; ' + clean + '; return artykul;');
      artykul = fn();
    } catch (e) {
      console.error(`BŁĄD parsowania ${file}:`, e.message);
      continue;
    }

    if (!artykul?.slug) { console.warn(`Pominięto ${file} — brak slug`); continue; }

    const exists = await db.query('SELECT id FROM "Artykul" WHERE slug = $1', [artykul.slug]);
    if (exists.rows.length > 0) {
      console.log(`~ Już istnieje: ${artykul.slug}`);
      continue;
    }

    const id = cuid();
    await db.query(
      `INSERT INTO "Artykul" (id, slug, title, excerpt, content, thumbnail, kolor, tags, photos, published, date, "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10,$11,$11)`,
      [
        id,
        artykul.slug,
        artykul.title,
        artykul.excerpt || '',
        artykul.content || '',
        artykul.thumbnail || null,
        artykul.kolor || null,
        artykul.tags || [],
        JSON.stringify(artykul.photos || []),
        artykul.date || new Date().toISOString().slice(0, 10),
        new Date(),
      ]
    );
    console.log(`+ Dodano: ${artykul.slug}`);
  }

  console.log('\nGotowe!');
  await db.end();
}

main().catch(e => { console.error(e); process.exit(1); });

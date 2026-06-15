// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Client } = require("pg");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

// Kolejność albumów z index.js: g002,g001,g004,g005,g003
const albumFiles = [
  { file: "002-sokol-granowo-2025-2026-wyjazd.js",      kolejnosc: 0 },
  { file: "001-strzala-plotno-2025-2026-wyjazd.js",     kolejnosc: 1 },
  { file: "004-luks-pomorzanin-zamecin-2025-2026-domowy.js", kolejnosc: 2 },
  { file: "005-grom-plonno-2025-2026-wyjazd.js",        kolejnosc: 3 },
  { file: "003-blyskawica-kluki-2025-2026-wyjazd.js",   kolejnosc: 4 },
];

function parseAlbum(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  // Strip "const album = " prefix and "export default album;" suffix
  const stripped = src
    .replace(/^const\s+album\s*=\s*/m, "")
    .replace(/;\s*export\s+default\s+album\s*;?\s*$/m, "")
    .replace(/export\s+default\s+album\s*;?\s*$/m, "")
    .trim();
  // Use Function to eval the object literal
  // eslint-disable-next-line no-new-func
  return new Function(`return (${stripped})`)();
}

async function main() {
  const client = new Client({ connectionString: "postgresql://drawa:Freeasahorse1423@localhost:5432/drawa_fc" });
  await client.connect();

  const dir = path.join(__dirname, "../content/galeria");
  let inserted = 0, skipped = 0;

  for (const { file, kolejnosc } of albumFiles) {
    const album = parseAlbum(path.join(dir, file));
    const slug = album.slug;

    const ex = await client.query(`SELECT id FROM "Album" WHERE slug=$1`, [slug]);
    if (ex.rows.length > 0) { console.log(`SKIP: ${slug}`); skipped++; continue; }

    const photos = (album.photos || []).map(p => ({ src: p.src, caption: p.caption || "" }));

    await client.query(
      `INSERT INTO "Album" (id, slug, tytul, date, tags, thumbnail, author, "hrefAuthor", photos, kolejnosc, published, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,true,NOW(),NOW())`,
      [
        slug,
        album.title,
        album.date,
        album.tags || [],
        album.thumbnail || null,
        album.author || null,
        album.href_author || null,
        JSON.stringify(photos),
        kolejnosc,
      ]
    );
    console.log(`OK: ${slug} (${photos.length} zdjęć)`);
    inserted++;
  }

  console.log(`\nGotowe: ${inserted} dodanych, ${skipped} pominięto`);
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });

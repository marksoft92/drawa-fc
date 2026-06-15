import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const raw = readFileSync(path.join(__dirname, "../lib/drawa_data_b_klasa_2025_2026.js"), "utf8");
const stripped = raw.replace(/^const drawa\s*=/, "return").replace(/\nexport default drawa;?\s*$/, "");
const drawa = new Function(stripped)();

const { Pool } = pg;
const pool = new Pool({ connectionString: "postgresql://drawa:Freeasahorse1423@localhost:5432/drawa_fc" });

const SEZON = "2025/26";

async function seedTabela() {
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM "TabelaDruzyna" WHERE sezon = $1`, [SEZON]);
    for (const row of drawa.tabela) {
      const [bramkiZd, bramkiStr] = (row.bramki || "0:0").split(":").map(Number);
      await client.query(
        `INSERT INTO "TabelaDruzyna" (id, sezon, pozycja, nazwa, herb, pkt, mecze, wygrane, remisy, przegrane, "bramkiZd", "bramkiStr", forma, "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())`,
        [
          SEZON,
          parseInt(row.pozycja),
          row.nazwa,
          row.herb || null,
          parseInt(row.pkt) || 0,
          parseInt(row.mecze) || 0,
          parseInt(row.wygrane) || 0,
          parseInt(row.remisy) || 0,
          parseInt(row.przegrane) || 0,
          bramkiZd || 0,
          bramkiStr || 0,
          row.forma || null,
        ]
      );
    }
    console.log(`Tabela: inserted ${drawa.tabela.length} rows`);
  } finally {
    client.release();
  }
}

async function seedMecze() {
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM "Mecz" WHERE sezon = $1`, [SEZON]);
    let count = 0;
    for (const m of drawa.mecze) {
      if (!m.team1 || !m.team2) continue;

      const strzelcy            = Array.isArray(m.strzelcy)            ? m.strzelcy            : [];
      const kartki              = Array.isArray(m.kartki)              ? m.kartki              : [];
      const zmiany              = Array.isArray(m.zmiany)              ? m.zmiany              : [];
      const wszystkieZdarzenia  = Array.isArray(m.wszystkie_zdarzenia) ? m.wszystkie_zdarzenia : [];
      const sklady              = m.sklady && typeof m.sklady === "object" ? m.sklady : {};

      await client.query(
        `INSERT INTO "Mecz" (id, sezon, liga, team1, team2, herb1, herb2, score, date, walkower, status, komentarz,
           strzelcy, kartki, zmiany, "wszystkieZdarzenia", sklady, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, now(), now())`,
        [
          SEZON,
          m.liga || null,
          m.team1,
          m.team2,
          m.herb1 || null,
          m.herb2 || null,
          m.score || null,
          m.date || "",
          Boolean(m.walkower),
          m.status || null,
          m.komentarz || null,
          JSON.stringify(strzelcy),
          JSON.stringify(kartki),
          JSON.stringify(zmiany),
          JSON.stringify(wszystkieZdarzenia),
          JSON.stringify(sklady),
        ]
      );
      count++;
    }
    console.log(`Mecze: inserted ${count} rows`);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await seedTabela();
    await seedMecze();
    console.log("Done!");
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

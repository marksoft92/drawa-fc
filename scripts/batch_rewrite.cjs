/**
 * Batch rewrite — przetwarza nieopublikowane wpisy FB na artykuły przez OpenRouter.
 * Uruchamiany jako osobny proces (jak scraper).
 * Status zapisywany w tmp/batch_rewrite_status.json.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ROOT = path.join(__dirname, '..');
const TMP_DIR = path.join(ROOT, 'tmp');
const STATUS_FILE = path.join(TMP_DIR, 'batch_rewrite_status.json');

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

const FREE_MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3-next-80b-a3b-instruct",
  "nousresearch/hermes-3-405b-instruct",
  "meta-llama/llama-3.3-70b-instruct",
  "nvidia/nemotron-3-nano-30b-a3b",
  "openai/gpt-oss-20b",
];

const SYSTEM_PROMPT = `Jesteś redaktorem portalu piłkarskiego z zachodniopomorskiego. Dostajesz surowy post z Facebooka klubu piłkarskiego i musisz go przepisać na pełny artykuł dziennikarski.

ZASADY:
- Pisz w 3. osobie (np. "Klub X poinformował", "Drużyna rozegrała")
- Rozbuduj treść do kilku akapitów (minimum 3-4)
- Dodaj kontekst sportowy jeśli to możliwe
- Zachowaj WSZYSTKIE fakty z oryginału (wyniki, nazwiska, daty, godziny)
- Nie wymyślaj faktów których nie ma w oryginale
- Usuń emoji, hashtagi, tagi sponsorów
- Ton: rzeczowy, dziennikarski, ale przyjazny
- Nie dodawaj na końcu podsumowań typu "Będziemy śledzić losy..."

ODPOWIEDZ DOKŁADNIE W TYM FORMACIE (bez żadnych dodatkowych komentarzy):
TYTUŁ: [tytuł artykułu]
---
[treść artykułu]`;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeStatus(data) {
  ensureDir(TMP_DIR);
  fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
}

function readStatus() {
  try { return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8')); }
  catch { return { status: 'idle' }; }
}

function wasStopped() {
  return readStatus().status !== 'running';
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l')
    .replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function callOpenRouter(model, klubNazwa, tresc) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Klub: ${klubNazwa}\n\nOryginalny post z Facebooka:\n${tresc}` },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const req = https.request('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://drawa-fc.pl',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 45000,
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode !== 200) return reject(new Error(`${model}: HTTP ${res.statusCode}`));
        try {
          const data = JSON.parse(raw);
          const content = data.choices?.[0]?.message?.content;
          if (!content) return reject(new Error(`${model}: pusta odpowiedź`));
          resolve({ content, model });
        } catch (e) { reject(new Error(`${model}: JSON parse error`)); }
      });
    });
    req.on('error', e => reject(new Error(`${model}: ${e.message}`)));
    req.on('timeout', () => { req.destroy(); reject(new Error(`${model}: timeout`)); });
    req.write(body);
    req.end();
  });
}

function parseResponse(raw) {
  const lines = raw.trim().split('\n');
  let tytul = '';
  let tresc = '';
  let separatorIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('TYTUŁ:')) tytul = lines[i].replace('TYTUŁ:', '').trim();
    if (lines[i].trim() === '---') { separatorIdx = i; break; }
  }

  if (separatorIdx >= 0) {
    tresc = lines.slice(separatorIdx + 1).join('\n').trim();
  } else if (tytul) {
    tresc = lines.filter(l => !l.startsWith('TYTUŁ:')).join('\n').trim();
  } else {
    tytul = (lines[0] || '').replace(/^#+\s*/, '').trim();
    tresc = lines.slice(1).join('\n').trim();
  }

  tytul = tytul.replace(/^["„]+|["„]+$/g, '').replace(/^#+\s*/, '').trim();
  return { tytul, tresc };
}

async function main() {
  if (!OPENROUTER_KEY) {
    writeStatus({ status: 'error', progress: 'Brak OPENROUTER_API_KEY', finishedAt: new Date().toISOString() });
    process.exit(1);
  }

  const connStr = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString: connStr.replace(/\?.*$/, '') });

  writeStatus({ status: 'running', startedAt: new Date().toISOString(), done: 0, total: 0, ok: 0, fail: 0, current: null });

  try {
    const { rows: wpisy } = await pool.query(`
      SELECT w.id, w.tytul, w.tresc, z.nazwa as "zrodloNazwa"
      FROM "WpisLigowy" w
      JOIN "ZrodloFB" z ON w."zrodloId" = z.id
      WHERE w.published = false
      ORDER BY w."createdAt" ASC
    `);

    const total = wpisy.length;
    let done = 0, ok = 0, fail = 0;
    const errors = [];

    writeStatus({ status: 'running', startedAt: new Date().toISOString(), done, total, ok, fail, current: null });

    for (const w of wpisy) {
      if (wasStopped()) break;

      const currentLabel = w.zrodloNazwa + ': ' + (w.tytul || w.tresc.slice(0, 50));
      writeStatus({ status: 'running', startedAt: readStatus().startedAt, done, total, ok, fail, current: currentLabel });

      let rewritten = null;
      for (const model of FREE_MODELS) {
        if (wasStopped()) break;
        try {
          const { content } = await callOpenRouter(model, w.zrodloNazwa, w.tresc);
          const parsed = parseResponse(content);
          if (parsed.tytul && parsed.tresc && parsed.tresc.length >= 100) {
            rewritten = { ...parsed, model };
            break;
          }
        } catch {}
      }

      if (rewritten) {
        const slug = slugify(rewritten.tytul) + '-' + w.id.slice(-6);
        try {
          await pool.query(
            `UPDATE "WpisLigowy" SET tytul = $1, tresc = $2, slug = $3, published = true, "updatedAt" = NOW() WHERE id = $4`,
            [rewritten.tytul, rewritten.tresc, slug, w.id]
          );
          ok++;
        } catch (e) {
          errors.push(`DB error ${w.id}: ${e.message}`);
          fail++;
        }
      } else {
        errors.push(`AI fail: ${w.id}`);
        fail++;
      }

      done++;
    }

    writeStatus({
      status: 'done',
      startedAt: readStatus().startedAt,
      finishedAt: new Date().toISOString(),
      done, total, ok, fail, current: null,
      errors: errors.slice(0, 20),
    });
  } catch (e) {
    writeStatus({ status: 'error', progress: e.message, finishedAt: new Date().toISOString() });
  }

  await pool.end();
}

main();

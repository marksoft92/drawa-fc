/**
 * Batch rewrite — przetwarza nieopublikowane wpisy FB na artykuły przez OpenRouter.
 * Uruchamiany jako osobny proces (jak scraper).
 * Status zapisywany w tmp/batch_rewrite_status.json.
 *
 * Przetwarza wiele wpisów równolegle (pula workerów) zamiast jeden po drugim —
 * gdy wpis A czeka na odpowiedź modelu, wpis B jest już w trakcie na innym workerze.
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

// Kilka kluczy API — gdy jeden wyczerpie dzienny limit darmowych zapytań,
// przechodzimy na kolejny zamiast czekać do jutra.
const OPENROUTER_KEYS = [process.env.OPENROUTER_API_KEY, process.env.OPENROUTER_API_KEY_2].filter(Boolean);
const INDEXNOW_KEY = 'c2bde26566f3c19e8c143ffe94cde083';
const SITE_HOST = 'mksdrawadrawno.pl';

// Tylko modele zweryfikowane jako wciąż dostępne w darmowym tierze OpenRouter
// (wiele popularnych :free slugów zostało wycofanych — sprawdzaj okresowo).
// Uwaga: limit darmowych requestów jest WSPÓLNY dla całego konta (50/dzień bez
// kredytów, 1000/dzień po doładowaniu $10+), nie per-model.
const FREE_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "liquid/lfm-2.5-2.6b:free",
  "dots-studio/dots-3-note-preview:free",
  "poolside/laguna-s-2.1:free",
  "poolside/laguna-xs-2.1:free",
];

const CONCURRENCY = FREE_MODELS.length;

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
TAGI: [2-4 tagi oddzielone przecinkami, np: transfery, wyniki, zapowiedź, B klasa]
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

function pingIndexNow(urlPath) {
  const url = `https://api.indexnow.org/indexnow?url=https://${SITE_HOST}${urlPath}&key=${INDEXNOW_KEY}`;
  https.get(url, () => {}).on('error', () => {});
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l')
    .replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 80).replace(/-$/g, '');
}

function callOpenRouter(model, klubNazwa, tresc, apiKey) {
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
        'Authorization': `Bearer ${apiKey}`,
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
        if (res.statusCode !== 200) {
          let msg = `${model}: HTTP ${res.statusCode}`;
          let isDailyLimit = false;
          let resetAt = null;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.error?.message) msg = `${model}: ${parsed.error.message}`;
            isDailyLimit = res.statusCode === 429 && /free-models-per-day/.test(parsed.error?.message || '');
            const resetMs = parsed.error?.metadata?.headers?.['X-RateLimit-Reset'];
            if (resetMs) resetAt = new Date(Number(resetMs)).toISOString();
          } catch {}
          const err = new Error(msg);
          err.isDailyLimit = isDailyLimit;
          err.resetAt = resetAt;
          return reject(err);
        }
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
  let tags = [];
  let tresc = '';
  let separatorIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('TYTUŁ:')) tytul = lines[i].replace('TYTUŁ:', '').trim();
    if (lines[i].startsWith('TAGI:')) tags = lines[i].replace('TAGI:', '').split(',').map(t => t.trim()).filter(Boolean);
    if (lines[i].trim() === '---') { separatorIdx = i; break; }
  }

  if (separatorIdx >= 0) {
    tresc = lines.slice(separatorIdx + 1).join('\n').trim();
  } else if (tytul) {
    tresc = lines.filter(l => !l.startsWith('TYTUŁ:') && !l.startsWith('TAGI:')).join('\n').trim();
  } else {
    tytul = (lines[0] || '').replace(/^#+\s*/, '').trim();
    tresc = lines.slice(1).join('\n').trim();
  }

  tytul = tytul.replace(/^["„]+|["„]+$/g, '').replace(/^#+\s*/, '').trim();
  return { tytul, tags, tresc };
}

async function main() {
  if (OPENROUTER_KEYS.length === 0) {
    writeStatus({ status: 'error', progress: 'Brak OPENROUTER_API_KEY', finishedAt: new Date().toISOString() });
    process.exit(1);
  }

  const connStr = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString: connStr.replace(/\?.*$/, '') });

  const startedAt = new Date().toISOString();
  writeStatus({ status: 'running', startedAt, done: 0, total: 0, ok: 0, fail: 0, current: null });

  try {
    const { rows: wpisy } = await pool.query(`
      SELECT w.id, w.tytul, w.tresc, z.nazwa as "zrodloNazwa"
      FROM "WpisLigowy" w
      JOIN "ZrodloFB" z ON w."zrodloId" = z.id
      WHERE w.published = false
      ORDER BY w."createdAt" ASC
    `);

    const total = wpisy.length;
    let nextIndex = 0;
    let done = 0, ok = 0, fail = 0;
    let dailyLimitHit = null; // trzyma info o resetAt gdy wszystkie klucze wyczerpane
    const exhaustedKeys = new Set();
    let lastResetAt = null;
    const errors = [];
    const inProgress = new Map(); // workerId -> label

    function nextItem() {
      if (nextIndex >= wpisy.length) return null;
      return wpisy[nextIndex++];
    }

    function pushStatus() {
      writeStatus({
        status: 'running',
        startedAt,
        done, total, ok, fail,
        current: Array.from(inProgress.values()).join(' | ') || null,
      });
    }

    async function processOne(w) {
      let rewritten = null;
      modelLoop:
      for (const model of FREE_MODELS) {
        if (wasStopped() || dailyLimitHit) break;
        for (const key of OPENROUTER_KEYS) {
          if (exhaustedKeys.has(key)) continue;
          if (wasStopped() || dailyLimitHit) break modelLoop;
          try {
            const { content } = await callOpenRouter(model, w.zrodloNazwa, w.tresc, key);
            const parsed = parseResponse(content);
            if (parsed.tytul && parsed.tresc && parsed.tresc.length >= 100) {
              rewritten = { ...parsed, model };
              break modelLoop;
            }
          } catch (e) {
            if (e.isDailyLimit) {
              exhaustedKeys.add(key);
              lastResetAt = e.resetAt || lastResetAt;
              if (exhaustedKeys.size >= OPENROUTER_KEYS.length) {
                dailyLimitHit = lastResetAt || new Date().toISOString();
                break modelLoop;
              }
            }
          }
        }
      }

      if (rewritten) {
        const slug = slugify(rewritten.tytul) + '-' + w.id.slice(-6);
        try {
          await pool.query(
            `UPDATE "WpisLigowy" SET tytul = $1, tresc = $2, slug = $3, tags = $4::text[], published = true, "updatedAt" = NOW() WHERE id = $5`,
            [rewritten.tytul, rewritten.tresc, slug, rewritten.tags, w.id]
          );
          pingIndexNow(`/pilka-lokalna/${slug}`);
          ok++;
        } catch (e) {
          errors.push(`DB error ${w.id}: ${e.message}`);
          fail++;
        }
      } else if (!dailyLimitHit) {
        errors.push(`AI fail: ${w.id}`);
        fail++;
      }
      // gdy trafiliśmy na dailyLimitHit w trakcie tego itemu, nie liczymy go
      // jako fail — wpis zostaje published=false, więc kolejne uruchomienie
      // batcha (który za każdym razem odpytuje DB od nowa) go podejmie ponownie

      done++;
    }

    async function worker(workerId) {
      while (true) {
        if (wasStopped() || dailyLimitHit) return;
        const w = nextItem();
        if (!w) return;

        inProgress.set(workerId, w.zrodloNazwa + ': ' + (w.tytul || w.tresc.slice(0, 50)));
        pushStatus();

        await processOne(w);

        inProgress.delete(workerId);
        pushStatus();
      }
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY, Math.max(total, 1)) }, (_, i) => worker(i));
    await Promise.all(workers);

    if (dailyLimitHit) {
      writeStatus({
        status: 'error',
        startedAt,
        finishedAt: new Date().toISOString(),
        done, total, ok, fail,
        progress: `Wyczerpany dzienny limit darmowych zapytań OpenRouter. Reset: ${dailyLimitHit}. Uruchom ponownie po resecie (dokończy od miejsca przerwania) — albo doładuj konto na openrouter.ai/settings/credits, żeby podnieść limit z 50 do 1000/dzień.`,
        errors: errors.slice(0, 20),
      });
    } else {
      writeStatus({
        status: 'done',
        startedAt,
        finishedAt: new Date().toISOString(),
        done, total, ok, fail, current: null,
        errors: errors.slice(0, 20),
      });
    }
  } catch (e) {
    writeStatus({ status: 'error', progress: e.message, finishedAt: new Date().toISOString() });
  }

  await pool.end();
}

main();

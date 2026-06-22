/**
 * Drawa FC — Facebook scraper ligowy
 *
 * Ściąga posty z publicznych stron FB klubów z ligi
 * używając www.facebook.com + Googlebot User-Agent (server-rendered HTML z JSON).
 *
 * Wynik: nowe wpisy w tabeli WpisLigowy (published=false).
 *
 * Uruchomienie:
 *   node scripts/scraper_fb.cjs
 *
 * Wymaga: cheerio, sharp, pg, dotenv
 */

const crypto = require('crypto');
const sharp = require('sharp');
const https = require('https');
const http = require('http');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ROOT = path.join(__dirname, '..');
const TMP_DIR = path.join(ROOT, 'tmp');
const UPLOADS_DIR = path.join(ROOT, 'public', 'uploads');
const STATUS_FILE = path.join(TMP_DIR, 'scraper_fb_status.json');

const GOOGLEBOT_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeStatus(data) {
  ensureDir(TMP_DIR);
  fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function hashText(text) {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
}

function genId() {
  return Date.now().toString(36) + crypto.randomBytes(8).toString('hex');
}

function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, {
      headers: {
        'User-Agent': GOOGLEBOT_UA,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pl-PL,pl;q=0.9',
        'Accept-Encoding': 'identity',
      },
      timeout: 25000,
    }, res => {
      if ([301, 302, 303, 307].includes(res.statusCode)) {
        const loc = res.headers.location;
        if (loc) return fetchHTML(loc.startsWith('http') ? loc : `https://www.facebook.com${loc}`).then(resolve).catch(reject);
        return reject(new Error(`Redirect bez location`));
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { headers: { 'User-Agent': GOOGLEBOT_UA }, timeout: 15000 }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function extractPageSlug(fbUrl) {
  let url = fbUrl.trim().replace(/\/+$/, '');
  const idMatch = url.match(/profile\.php\?id=(\d+)/);
  if (idMatch) return `profile.php?id=${idMatch[1]}`;
  url = url.replace(/https?:\/\/(www\.|m\.|mbasic\.)?facebook\.com\/?/, '');
  url = url.replace(/\/.*$/, '');
  return url;
}

function decodeUnicode(str) {
  try {
    return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  } catch {
    return str;
  }
}

// Max age of posts to import (days)
const MAX_POST_AGE_DAYS = 7;

function extractPostsFromHTML(html) {
  const posts = [];
  const seen = new Set();
  const now = Date.now();
  const maxAgeMs = MAX_POST_AGE_DAYS * 24 * 60 * 60 * 1000;

  // Pre-index all creation_time positions for fast nearest-match lookup
  const ctRegex = /"creation_time":(\d+)/g;
  const ctEntries = [];
  let ctMatch;
  while ((ctMatch = ctRegex.exec(html)) !== null) {
    ctEntries.push({ pos: ctMatch.index, ts: parseInt(ctMatch[1]) });
  }

  function findNearestTime(pos) {
    let best = null;
    for (const ct of ctEntries) {
      const dist = Math.abs(ct.pos - pos);
      if (!best || dist < best.dist) best = { dist, ts: ct.ts };
    }
    return best;
  }

  const msgRegex = /"message":\{"text":"((?:[^"\\]|\\.)*)"/g;
  let match;

  while ((match = msgRegex.exec(html)) !== null) {
    const rawText = match[1];
    const text = decodeUnicode(rawText).replace(/\\n/g, '\n').replace(/\\\\/g, '\\').replace(/\\"/g, '"');

    if (text.length < 15) continue;

    const h = hashText(text);
    if (seen.has(h)) continue;
    seen.add(h);

    // Find nearest creation_time
    const nearest = findNearestTime(match.index);
    let date = null;
    if (nearest) {
      const postAge = now - nearest.ts * 1000;
      if (postAge > maxAgeMs) continue; // skip old posts
      date = new Date(nearest.ts * 1000).toISOString().split('T')[0];
    }

    // Look for thumbnail image in surrounding context (wider range)
    const contextStart = Math.max(0, match.index - 25000);
    const contextEnd = Math.min(html.length, match.index + match[0].length + 5000);
    const context = html.slice(contextStart, contextEnd);

    let imageUrl = null;
    const thumbMatch = context.match(/"preferred_thumbnail":\{"image":\{"uri":"((?:[^"\\]|\\.)*)"/);
    if (thumbMatch) {
      imageUrl = decodeUnicode(thumbMatch[1]).replace(/\\\//g, '/');
    }
    if (!imageUrl) {
      const imgMatch = context.match(/"full_image":\{"uri":"((?:[^"\\]|\\.)*)"/);
      if (imgMatch) imageUrl = decodeUnicode(imgMatch[1]).replace(/\\\//g, '/');
    }
    if (!imageUrl) {
      const imgMatch2 = context.match(/"image":\{"uri":"(https:\/\/scontent[^"\\]*)"/);
      if (imgMatch2) imageUrl = decodeUnicode(imgMatch2[1]).replace(/\\\//g, '/');
    }

    posts.push({ text, date, imageUrl });
  }

  return posts;
}

async function saveImage(buffer) {
  ensureDir(UPLOADS_DIR);
  const filename = `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`;
  const dest = path.join(UPLOADS_DIR, filename);
  try {
    const webp = await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    fs.writeFileSync(dest, webp);
    return `/uploads/${filename}`;
  } catch {
    return null;
  }
}

// ━━━ LLM REWRITE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function rewritePost(text, clubName) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const prompt = `Przepisz poniższy post z Facebooka klubu "${clubName}" na krótką wiadomość w 3 osobie, jak informacja na portalu sportowym. Napisz też tytuł (max 80 znaków).

ZASADY:
- Pisz w 3 osobie (np. "${clubName} ogłosił..." zamiast "Ogłaszamy...")
- Zachowaj fakty, daty, wyniki, nazwiska
- Usuń emotikony, hashtagi, CTA ("polub", "udostępnij")
- Ton: neutralny, dziennikarski, po polsku
- Nie dodawaj informacji których nie ma w oryginale

FORMAT ODPOWIEDZI (dokładnie tak):
TYTUŁ: <tytuł>
TREŚĆ: <treść>

POST DO PRZEPISANIA:
${text.slice(0, 2000)}`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mksdrawadrawno.pl',
        'X-Title': 'MKS Drawa Scraper',
      },
      body: JSON.stringify({
        model: 'google/gemma-4-31b-it:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      console.log(`     ⚠️ LLM HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || '';

    const titleMatch = reply.match(/TYTU[ŁL]:\s*(.+)/i);
    const contentMatch = reply.match(/TRE[SŚ][CĆ]:\s*([\s\S]+)/i);

    if (titleMatch && contentMatch) {
      return {
        tytul: titleMatch[1].trim().replace(/^["„]|[""]$/g, ''),
        tresc: contentMatch[1].trim(),
      };
    }
    return null;
  } catch (err) {
    console.log(`     ⚠️ LLM: ${err.message}`);
    return null;
  }
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l')
    .replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ━━━ MAIN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(async () => {
  const startedAt = new Date().toISOString();
  console.log(`[${startedAt}] Scraper FB start`);
  writeStatus({ status: 'running', startedAt, progress: 'Łączenie z bazą...', finishedAt: null, stats: null });

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { rows: zrodla } = await pool.query(
      'SELECT id, nazwa, "fbUrl" FROM "ZrodloFB" WHERE aktywne = true'
    );

    if (!zrodla.length) {
      console.log('Brak aktywnych źródeł');
      writeStatus({ status: 'done', startedAt, finishedAt: new Date().toISOString(), progress: 'Brak aktywnych źródeł', stats: { zrodla: 0, noweWpisy: 0 } });
      await pool.end();
      return;
    }

    console.log(`Znaleziono ${zrodla.length} aktywnych źródeł`);

    let totalNew = 0;
    let totalSkipped = 0;
    const errors = [];

    for (let i = 0; i < zrodla.length; i++) {
      const z = zrodla[i];
      writeStatus({
        status: 'running', startedAt, finishedAt: null,
        progress: `[${i + 1}/${zrodla.length}] ${z.nazwa}...`,
        stats: { noweWpisy: totalNew },
      });

      try {
        const slug = extractPageSlug(z.fbUrl);
        if (!slug) { errors.push(`${z.nazwa}: nie można wyciągnąć slug z URL`); continue; }

        const fbUrl = slug.includes('?')
          ? `https://www.facebook.com/${slug}`
          : `https://www.facebook.com/${slug}/`;
        console.log(`  📥 [${i + 1}/${zrodla.length}] ${z.nazwa}: ${fbUrl}`);

        const html = await fetchHTML(fbUrl);
        console.log(`     HTML: ${html.length} znaków`);

        const posts = extractPostsFromHTML(html);
        console.log(`     Znaleziono ${posts.length} postów`);

        for (const post of posts) {
          const h = hashText(post.text);

          const { rowCount } = await pool.query(
            'SELECT 1 FROM "WpisLigowy" WHERE "fbHash" = $1', [h]
          );
          if (rowCount > 0) { totalSkipped++; continue; }

          // Download image if available
          const localImages = [];
          if (post.imageUrl) {
            try {
              const buf = await downloadBuffer(post.imageUrl);
              if (buf.length > 1000) {
                const localPath = await saveImage(buf);
                if (localPath) localImages.push(localPath);
              }
            } catch (imgErr) {
              console.log(`     ⚠️ Obrazek: ${imgErr.message}`);
            }
          }

          // Rewrite via LLM (with small delay to not spam the API)
          if (totalNew > 0) await sleep(1000);
          const rewrite = await rewritePost(post.text, z.nazwa);
          const tytul = rewrite?.tytul || '';
          const tresc = rewrite?.tresc || post.text;

          const id = genId();
          const autoSlug = tytul ? slugify(tytul) + '-' + id.slice(-6) : `fb-${id}`;
          await pool.query(
            `INSERT INTO "WpisLigowy" (id, "zrodloId", "fbHash", tytul, slug, tresc, miniaturka, obrazki, "dataPostu", published, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, NOW(), NOW())`,
            [id, z.id, h, tytul, autoSlug, tresc, localImages[0] || null, JSON.stringify(localImages), post.date || null]
          );
          totalNew++;
          console.log(`     ✅ ${tytul || post.text.slice(0, 50).replace(/\n/g, ' ')}...`);
        }

      } catch (err) {
        console.error(`  ❌ ${z.nazwa}: ${err.message}`);
        errors.push(`${z.nazwa}: ${err.message}`);
      }

      if (i < zrodla.length - 1) {
        const delay = 3000 + Math.random() * 3000;
        console.log(`     ⏳ Czekam ${Math.round(delay / 1000)}s...`);
        await sleep(delay);
      }
    }

    const finishedAt = new Date().toISOString();
    writeStatus({
      status: 'done', startedAt, finishedAt,
      progress: errors.length ? `Gotowe (${errors.length} błędów)` : 'Gotowe!',
      stats: { zrodla: zrodla.length, noweWpisy: totalNew, pominiete: totalSkipped, bledy: errors },
    });

    console.log(`\n✅ Gotowe: ${totalNew} nowych, ${totalSkipped} pominiętych, ${errors.length} błędów`);

  } catch (err) {
    console.error('💥 Krytyczny błąd:', err);
    writeStatus({
      status: 'error', startedAt,
      finishedAt: new Date().toISOString(),
      progress: `Błąd: ${err.message}`,
      stats: null,
    });
  } finally {
    await pool.end().catch(() => {});
  }
})();

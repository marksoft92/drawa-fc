/**
 * Drawa FC — Facebook scraper ligowy
 *
 * Ściąga posty z publicznych stron FB klubów z ligi.
 * Wynik: nowe wpisy w tabeli WpisLigowy (published=false).
 *
 * Uruchomienie:
 *   node scripts/scraper_fb.cjs
 *
 * Wymaga: cheerio, sharp, pg, dotenv
 */

const { load } = require('cheerio');
const crypto = require('crypto');
const sharp = require('sharp');
const https = require('https');
const http = require('http');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ROOT = path.join(__dirname, '..');
const TMP_DIR = path.join(ROOT, 'tmp');
const UPLOADS_DIR = path.join(ROOT, 'public', 'uploads');
const STATUS_FILE = path.join(TMP_DIR, 'scraper_fb_status.json');

const USER_AGENT = 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeStatus(data) {
  ensureDir(TMP_DIR);
  fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function hash(text) {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
}

function genId() {
  const t = Date.now().toString(36);
  const r = crypto.randomBytes(8).toString('hex');
  return `${t}${r}`;
}

function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.5',
        'Accept-Encoding': 'identity',
      },
      timeout: 20000,
    }, res => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303) {
        const loc = res.headers.location;
        if (loc) return fetchHTML(loc.startsWith('http') ? loc : `https://mbasic.facebook.com${loc}`).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
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
    const req = proto.get(url, { headers: { 'User-Agent': USER_AGENT }, timeout: 15000 }, res => {
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
  // Handle profile.php?id=XXXX format
  const idMatch = url.match(/profile\.php\?id=(\d+)/);
  if (idMatch) return `profile.php?id=${idMatch[1]}`;
  url = url.replace(/https?:\/\/(www\.|m\.|mbasic\.)?facebook\.com\/?/, '');
  url = url.replace(/\/.*$/, '');
  return url;
}

function parsePosts($) {
  const posts = [];

  // mbasic.facebook.com uses <div id="recent_capsule_container"> or similar
  // posts are typically in <div> with role="article" or inside story containers
  // The structure: each post is in a div that contains the text + optional images

  // Strategy: find all story/post containers
  const selectors = [
    'div[data-ft]',
    'article',
    '#recent_capsule_container > div > div',
    '#structured_composer_async_container ~ div > div > div',
    'div.story_body_container',
  ];

  const seen = new Set();
  const allEls = new Set();

  for (const sel of selectors) {
    $(sel).each((_, el) => allEls.add(el));
  }

  // If selectors didn't match, try a broad approach: divs that look like posts
  if (allEls.size === 0) {
    $('div').each((_, el) => {
      const $el = $(el);
      // A post div typically has some text and might have images
      const text = $el.children('div').first().text().trim();
      if (text.length > 30 && text.length < 5000) {
        // Check it's not a container of many posts
        const childDivs = $el.children('div').length;
        if (childDivs <= 5) allEls.add(el);
      }
    });
  }

  for (const el of allEls) {
    const $el = $(el);

    // Extract text
    let text = '';
    // Try specific content selectors first
    const candidates = [
      $el.find('div > div > span').first(),
      $el.find('p').first(),
      $el.find('div.bx').first(),
    ];
    for (const c of candidates) {
      if (c.length && c.text().trim().length > 15) {
        text = c.text().trim();
        break;
      }
    }
    if (!text) {
      // Fallback: get text but strip navigation/link-only content
      const clone = $el.clone();
      clone.find('a[href*="reaction"], a[href*="comment"], a[href*="share"], footer, header, form').remove();
      const allText = clone.text().trim();
      if (allText.length > 20 && allText.length < 5000) text = allText;
    }

    if (!text || text.length < 15) continue;
    // Skip meta-only text
    if (/^[\s\S]{0,30}(udostępni|shared|polub|like|skomentuj|odpowiedz)/i.test(text)) continue;

    // Dedup within page
    const h = hash(text);
    if (seen.has(h)) continue;
    seen.add(h);

    // Extract images
    const images = [];
    $el.find('img').each((_, img) => {
      const src = $(img).attr('src') || '';
      if (src.includes('emoji') || src.includes('rsrc.php') || src.includes('static')) return;
      if (src.includes('profile') || src.includes('avatar')) return;
      if (src.startsWith('http') && (src.includes('fbcdn') || src.includes('facebook') || src.includes('fbsbx'))) {
        images.push(src);
      }
    });

    // Extract date
    let date = null;
    const abbrEl = $el.find('abbr');
    if (abbrEl.length) date = abbrEl.first().text().trim();
    if (!date) {
      // Try timestamp from links
      const timeLink = $el.find('a[href*="/story.php"], a[href*="/permalink"]');
      if (timeLink.length) date = timeLink.first().text().trim();
    }

    posts.push({ text, images, date });
  }

  return posts;
}

async function saveImage(buffer) {
  ensureDir(UPLOADS_DIR);
  const filename = `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`;
  const dest = path.join(UPLOADS_DIR, filename);
  try {
    const webp = await sharp(buffer).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    fs.writeFileSync(dest, webp);
    return `/uploads/${filename}`;
  } catch {
    return null;
  }
}

(async () => {
  const startedAt = new Date().toISOString();
  console.log(`[${startedAt}] Scraper FB start`);
  writeStatus({ status: 'running', startedAt, progress: 'Łączenie z bazą...', finishedAt: null, stats: null });

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // 1. Fetch active sources
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
    writeStatus({ status: 'running', startedAt, progress: `Scrapuję ${zrodla.length} źródeł...`, finishedAt: null, stats: null });

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

        const fbUrl = `https://mbasic.facebook.com/${slug}`;
        console.log(`  📥 [${i + 1}/${zrodla.length}] ${z.nazwa}: ${fbUrl}`);

        const html = await fetchHTML(fbUrl);
        console.log(`     Pobrano HTML: ${html.length} znaków`);

        const $ = load(html);
        const posts = parsePosts($);
        console.log(`     Znaleziono ${posts.length} postów`);

        for (const post of posts) {
          const h = hash(post.text);

          // Check dedup
          const { rowCount } = await pool.query(
            'SELECT 1 FROM "WpisLigowy" WHERE "fbHash" = $1', [h]
          );
          if (rowCount > 0) { totalSkipped++; continue; }

          // Download images
          const localImages = [];
          for (const imgUrl of post.images.slice(0, 5)) {
            try {
              const buf = await downloadBuffer(imgUrl);
              if (buf.length > 1000) {
                const localPath = await saveImage(buf);
                if (localPath) localImages.push(localPath);
              }
            } catch (imgErr) {
              console.log(`     ⚠️ Nie udało się pobrać obrazka: ${imgErr.message}`);
            }
          }

          const id = genId();
          await pool.query(
            `INSERT INTO "WpisLigowy" (id, "zrodloId", "fbHash", tytul, slug, tresc, miniaturka, obrazki, "dataPostu", published, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, '', '', $4, $5, $6, $7, false, NOW(), NOW())`,
            [
              id,
              z.id,
              h,
              post.text,
              localImages[0] || null,
              JSON.stringify(localImages),
              post.date || null,
            ]
          );
          totalNew++;
          console.log(`     ✅ Nowy wpis (${post.text.slice(0, 60)}...)`);
        }

      } catch (err) {
        console.error(`  ❌ ${z.nazwa}: ${err.message}`);
        errors.push(`${z.nazwa}: ${err.message}`);
      }

      // Polite delay between pages
      if (i < zrodla.length - 1) {
        const delay = 3000 + Math.random() * 3000;
        console.log(`     ⏳ Czekam ${Math.round(delay / 1000)}s...`);
        await sleep(delay);
      }
    }

    const finishedAt = new Date().toISOString();
    writeStatus({
      status: 'done',
      startedAt,
      finishedAt,
      progress: errors.length ? `Gotowe (${errors.length} błędów)` : 'Gotowe!',
      stats: { zrodla: zrodla.length, noweWpisy: totalNew, pominiete: totalSkipped, bledy: errors },
    });

    console.log(`\n✅ Gotowe: ${totalNew} nowych, ${totalSkipped} pominiętych, ${errors.length} błędów`);

  } catch (err) {
    console.error('💥 Krytyczny błąd:', err);
    writeStatus({
      status: 'error',
      startedAt,
      finishedAt: new Date().toISOString(),
      progress: `Błąd: ${err.message}`,
      stats: null,
    });
  } finally {
    await pool.end().catch(() => {});
  }
})();

/**
 * Drawa FC — Facebook scraper ligowy
 *
 * Ściąga posty z publicznych stron FB klubów z ligi.
 * Wynik: nowe wpisy w tabeli WpisLigowy (published=false).
 *
 * Uruchomienie:
 *   node scripts/scraper_fb.cjs
 *
 * Wymaga: playwright, cheerio, sharp, pg, dotenv
 */

const { chromium } = require('playwright');
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

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36' }, timeout: 15000 }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function extractPageSlug(fbUrl) {
  let url = fbUrl.trim().replace(/\/+$/, '');
  url = url.replace(/https?:\/\/(www\.|m\.|mbasic\.)?facebook\.com\/?/, '');
  url = url.replace(/\/.*$/, '');
  return url;
}

function parsePosts($) {
  const posts = [];

  // mbasic.facebook.com structures posts in #recent_capsule_container or in article tags
  // or in divs with data-ft. The structure varies, so we try multiple selectors.
  const containers = $('article, div[data-ft], #recent_capsule_container > div > div');

  containers.each((_, el) => {
    const $el = $(el);

    // Extract text — look for the main text content div
    let text = '';
    const textEl = $el.find('div > div > span, p, div.bx');
    if (textEl.length) {
      text = textEl.first().text().trim();
    }
    if (!text) {
      // Fallback: get direct text content, skip link-only nodes
      const allText = $el.text().trim();
      if (allText.length > 20 && allText.length < 5000) text = allText;
    }

    // Skip very short or empty posts
    if (!text || text.length < 15) return;
    // Skip "shared a" / "udostępnił" meta-text only
    if (/^[\s\S]{0,30}(udostępni|shared|polub|like)/i.test(text)) return;

    // Extract images
    const images = [];
    $el.find('img').each((_, img) => {
      const src = $(img).attr('src') || '';
      // Skip tiny icons, emoji, profile pics
      if (src.includes('emoji') || src.includes('rsrc.php') || src.includes('profile')) return;
      if (src.startsWith('http') && !src.includes('static')) {
        images.push(src);
      }
    });

    // Extract date if available
    let date = null;
    const abbrEl = $el.find('abbr');
    if (abbrEl.length) date = abbrEl.first().text().trim();

    posts.push({ text, images, date });
  });

  // Deduplicate posts by text similarity (mbasic can have nested duplicates)
  const seen = new Set();
  return posts.filter(p => {
    const h = hash(p.text);
    if (seen.has(h)) return false;
    seen.add(h);
    return true;
  });
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
  writeStatus({ status: 'running', startedAt, progress: 'Łączenie z bazą...', finishedAt: null, stats: null });

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let browser;

  try {
    // 1. Fetch active sources
    const { rows: zrodla } = await pool.query(
      'SELECT id, nazwa, "fbUrl" FROM "ZrodloFB" WHERE aktywne = true'
    );

    if (!zrodla.length) {
      writeStatus({ status: 'done', startedAt, finishedAt: new Date().toISOString(), progress: 'Brak aktywnych źródeł', stats: { zrodla: 0, noweWpisy: 0 } });
      await pool.end();
      return;
    }

    writeStatus({ status: 'running', startedAt, progress: `Uruchamiam przeglądarkę (${zrodla.length} źródeł)...`, finishedAt: null, stats: null });

    // 2. Launch Playwright
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

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

        const context = await browser.newContext({
          userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
          locale: 'pl-PL',
          viewport: { width: 412, height: 915 },
        });

        const page = await context.newPage();
        // Block unnecessary resources
        await page.route('**/*.{woff,woff2,ttf,mp4,mp3,css}', r => r.abort());

        const fbUrl = `https://mbasic.facebook.com/${slug}`;
        console.log(`  📥 ${z.nazwa}: ${fbUrl}`);

        await page.goto(fbUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(2000 + Math.random() * 2000);

        const html = await page.content();
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
              const localPath = await saveImage(buf);
              if (localPath) localImages.push(localPath);
            } catch { /* skip failed image */ }
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
        }

        await context.close();
      } catch (err) {
        console.error(`  ❌ ${z.nazwa}: ${err.message}`);
        errors.push(`${z.nazwa}: ${err.message}`);
      }

      // Polite delay between pages
      if (i < zrodla.length - 1) await sleep(3000 + Math.random() * 3000);
    }

    writeStatus({
      status: 'done',
      startedAt,
      finishedAt: new Date().toISOString(),
      progress: errors.length ? `Gotowe (${errors.length} błędów)` : 'Gotowe!',
      stats: { zrodla: zrodla.length, noweWpisy: totalNew, pominiete: totalSkipped, bledy: errors },
    });

    console.log(`\n✅ Gotowe: ${totalNew} nowych wpisów, ${totalSkipped} pominiętych`);

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
    if (browser) await browser.close().catch(() => {});
    await pool.end().catch(() => {});
  }
})();

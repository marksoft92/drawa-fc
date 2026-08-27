/**
 * Push "za godzinę mecz" — uruchamiany cyklicznie z crona (np. co 15 min).
 * Sprawdza mecze bez wyniku, których termin przypada w ciągu najbliższej
 * godziny, i wysyła powiadomienie push raz na mecz (flaga notified1h).
 */

const { Pool } = require('pg');
const path = require('path');
const webpush = require('web-push');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONTHS = {
  sty: 0, lut: 1, mar: 2, kwi: 3, maj: 4, cze: 5,
  lip: 6, sie: 7, wrz: 8, "paź": 9, lis: 10, gru: 11,
};

function guessYear(month, now) {
  const nowMonth = now.getMonth();
  const nowYear = now.getFullYear();
  if (month >= 6) return nowMonth >= 6 ? nowYear : nowYear - 1;
  return nowMonth < 6 ? nowYear : nowYear + 1;
}

// Ten sam format co lib/parseMeczDate.js (np. "22 sie 16:00") — bez roku,
// więc dobieramy go względem dzisiejszej daty i sezonu lipiec-czerwiec.
function parseMeczDate(str, now = new Date()) {
  if (!str) return null;
  const tokens = str.replace(",", "").toLowerCase().split(/\s+/);
  let day = null, month = null, year = null, hours = 0, minutes = 0;

  for (const token of tokens) {
    if (/^\d{1,2}:\d{2}$/.test(token)) {
      const [h, m] = token.split(":").map(Number);
      hours = h; minutes = m;
      continue;
    }
    if (/^\d{4}$/.test(token)) { year = parseInt(token, 10); continue; }
    if (/^\d{1,2}$/.test(token)) { day = parseInt(token, 10); continue; }
    const matchedKey = Object.keys(MONTHS).find((k) => token.startsWith(k));
    if (matchedKey !== undefined) month = MONTHS[matchedKey];
  }

  if (day === null || month === null) return null;
  if (year === null) year = guessYear(month, now);
  return new Date(year, month, day, hours, minutes, 0, 0);
}

async function main() {
  if (!process.env.VAPID_PRIVATE_KEY) { console.log('Brak VAPID_PRIVATE_KEY — pomijam.'); return; }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const pool = new Pool({ connectionString: process.env.DATABASE_URL.replace(/\?.*$/, '') });

  try {
    const { rows: mecze } = await pool.query(
      `SELECT id, team1, team2, date FROM "Mecz" WHERE score IS NULL AND walkower = false AND "notified1h" = false`
    );

    const now = new Date();
    const dueSoon = mecze.filter((m) => {
      const d = parseMeczDate(m.date, now);
      if (!d) return false;
      const diffMin = (d.getTime() - now.getTime()) / 60000;
      return diffMin > 0 && diffMin <= 60;
    });

    if (dueSoon.length === 0) { await pool.end(); return; }

    const { rows: subs } = await pool.query(`SELECT endpoint, "p256dh", auth FROM "PushSubscription"`);

    for (const m of dueSoon) {
      const payload = JSON.stringify({
        title: '⏰ Za godzinę mecz',
        body: `${m.team1} vs ${m.team2}`,
        url: `/liga/mecz/${m.id}`,
        tag: `reminder-${m.id}`,
      });
      await Promise.allSettled(
        subs.map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload))
      );
      await pool.query(`UPDATE "Mecz" SET "notified1h" = true WHERE id = $1`, [m.id]);
      console.log(`Wysłano przypomnienie: ${m.team1} vs ${m.team2}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

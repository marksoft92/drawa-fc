/**
 * Seed: przenosi dane z lib/kadra.js do bazy (User + Player + Sezon + SezonStats).
 * Uruchom na VPS: node scripts/seed-kadra.cjs
 */

'use strict';

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv/config');

const SEZON_NAZWA = '2025/26';
const TEMP_PASSWORD = 'Drawa2025!'; // każdy gracz musi zmienić przy logowaniu

// Dane z lib/kadra.js (Nazwisko Imię → zamieniamy na Imię Nazwisko dla spójności z DB)
const zawodnicy = [
  { nazwiskoImie: 'Jędrasik Waldemar',       foto: '/kadra/jedrasik.jpg',      pozycja: 'Napastnik', pseudonim: 'Faza',             mecze: 18, gole: 36, asysty: 6,  zolte: 0, czerwone: 0, meczePuchar: 2, golePuchar: 2 },
  { nazwiskoImie: 'Dzierbun Remigiusz',       foto: '/kadra/remik.jpg',         pozycja: 'Pomocnik',  pseudonim: 'Remik',            mecze: 19, gole: 16, asysty: 3,  zolte: 2, czerwone: 0, meczePuchar: 2, golePuchar: 2 },
  { nazwiskoImie: 'Michalski Adrian',         foto: '/kadra/michalski.jpg',     pozycja: 'Pomocnik',  pseudonim: 'animator, adi',    mecze: 13, gole: 5,  asysty: 1,  zolte: 7, czerwone: 2, meczePuchar: 2, golePuchar: 0 },
  { nazwiskoImie: 'Kwaśnik Maciej',           foto: '/kadra/kwasnik.jpg',       pozycja: 'Napastnik', pseudonim: 'Kwaśnik',          mecze: 13, gole: 6,  asysty: 2,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Agudi Edmond Ogara',       foto: '/kadra/ogara.jpg',         pozycja: 'Pomocnik',  pseudonim: 'EDI',              mecze: 8,  gole: 6,  asysty: 4,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Radziwoń Łukasz',          foto: '/kadra/radziwon.jpg',      pozycja: 'Pomocnik',  pseudonim: 'Radzik',           mecze: 18, gole: 5,  asysty: 1,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Góralczyk Damian',         foto: '/kadra/goral.jpg',         pozycja: 'Obrońca',   pseudonim: 'Góral',            mecze: 7,  gole: 1,  asysty: 1,  zolte: 2, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Bieńkowski Dawid',         foto: '/kadra/bienkowski.jpg',    pozycja: 'Pomocnik',  pseudonim: 'Bieniu,Bienek',    mecze: 11, gole: 1,  asysty: 1,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Gławdel Maciej',           foto: '/kadra/glawdel.jpg',       pozycja: 'Obrońca',   pseudonim: 'Gławdel',          mecze: 16, gole: 1,  asysty: 0,  zolte: 1, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Grabek Jakub',             foto: '/kadra/grabek.jpg',        pozycja: 'Pomocnik',  pseudonim: 'Grabek',           mecze: 6,  gole: 1,  asysty: 0,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Śródecki Szymon',          foto: '/kadra/srudecki.jpg',      pozycja: 'Pomocnik',  pseudonim: 'Szymon z parku',   mecze: 9,  gole: 1,  asysty: 0,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Lewandowski Janusz',       foto: '/kadra/lewandowski.jpg',   pozycja: 'Pomocnik',  pseudonim: 'prezes Janek',     mecze: 16, gole: 1,  asysty: 0,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Czarnojan Paweł',          foto: '/kadra/czarnojan.jpg',     pozycja: 'Obrońca',   pseudonim: 'Czarny',           mecze: 7,  gole: 1,  asysty: 1,  zolte: 3, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Kwaśnik Michał',           foto: '/kadra/kwasnik_mi.jpg',    pozycja: 'Pomocnik',  pseudonim: 'Kwaśnik Michał',   mecze: 3,  gole: 0,  asysty: 1,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Filipowicz Szymon',        foto: '/kadra/filipowicz.jpg',    pozycja: 'Obrońca',   pseudonim: 'Filipo',           mecze: 13, gole: 0,  asysty: 0,  zolte: 3, czerwone: 1, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Skrzypiec Dominik',        foto: '/kadra/skrzypiec.jpg',     pozycja: 'Pomocnik',  pseudonim: 'Domino',           mecze: 15, gole: 0,  asysty: 2,  zolte: 1, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Piotrowski Krzysztof',     foto: '/kadra/piotrowski_k.jpg',  pozycja: 'Pomocnik',  pseudonim: 'Krzysiu',          mecze: 15, gole: 0,  asysty: 2,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Dzierbun Hubert',          foto: '/kadra/dzierbun_h.jpg',    pozycja: 'Bramkarz',  pseudonim: 'Huberto,chińczyk', mecze: 18, gole: 0,  asysty: 0,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Farbotko Krzysztof',       foto: '/kadra/farbotko.jpg',      pozycja: 'Obrońca',   pseudonim: 'Farbotko',         mecze: 16, gole: 0,  asysty: 0,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Rembiałkowski Jakub',      foto: '/kadra/rembialkowski.jpg', pozycja: 'Obrońca',   pseudonim: 'biały,kuba',       mecze: 7,  gole: 0,  asysty: 0,  zolte: 1, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Turkosz Bartłomiej',       foto: '/kadra/turkosz.jpg',       pozycja: 'Obrońca',   pseudonim: 'Bartek',           mecze: 11, gole: 0,  asysty: 0,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Wzorek Bartek',            foto: '/kadra/wzorek.jpg',        pozycja: 'Pomocnik',  pseudonim: 'Wzorek',           mecze: 10, gole: 0,  asysty: 0,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Zygała Jakub',             foto: '/kadra/zygala.jpg',        pozycja: 'Pomocnik',  pseudonim: 'Kuba prezes',      mecze: 0,  gole: 0,  asysty: 0,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Kalinowski Kamil',         foto: null,                        pozycja: 'Pomocnik',  pseudonim: '',                 mecze: 0,  gole: 0,  asysty: 0,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Piotrowski Jakub',         foto: null,                        pozycja: 'Pomocnik',  pseudonim: '',                 mecze: 5,  gole: 0,  asysty: 0,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Domagała Mateusz',         foto: null,                        pozycja: 'Pomocnik',  pseudonim: '',                 mecze: 3,  gole: 0,  asysty: 0,  zolte: 1, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Oliwier Mateusz',          foto: null,                        pozycja: 'Pomocnik',  pseudonim: '',                 mecze: 4,  gole: 0,  asysty: 0,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Piluk Piotr',              foto: null,                        pozycja: 'Pomocnik',  pseudonim: '',                 mecze: 3,  gole: 0,  asysty: 0,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Rembiałkowski Radosław',   foto: null,                        pozycja: 'Obrońca',   pseudonim: 'Radek',            mecze: 5,  gole: 0,  asysty: 0,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Rybak Eryk',               foto: null,                        pozycja: 'Bramkarz',  pseudonim: 'Rybak',            mecze: 2,  gole: 0,  asysty: 0,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Werner Jakub',             foto: null,                        pozycja: 'Pomocnik',  pseudonim: '',                 mecze: 1,  gole: 0,  asysty: 0,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Zając Dawid',              foto: null,                        pozycja: 'Pomocnik',  pseudonim: '',                 mecze: 6,  gole: 0,  asysty: 0,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
  { nazwiskoImie: 'Rembiałkowski Kamil',      foto: null,                        pozycja: 'Trener',    pseudonim: '',                 mecze: 0,  gole: 0,  asysty: 0,  zolte: 0, czerwone: 0, meczePuchar: 0, golePuchar: 0 },
];

// "Nazwisko Imię" → "Imię Nazwisko" (format DB) + login
function toImieNazwisko(nazwiskoImie) {
  const parts = nazwiskoImie.trim().split(/\s+/);
  if (parts.length === 1) return { imieNazwisko: parts[0], login: parts[0].toLowerCase() };
  const nazwisko = parts[0];
  const imie = parts.slice(1).join(' ');
  return { imieNazwisko: `${imie} ${nazwisko}`, login: slugify(imie + nazwisko) };
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e').replace(/ł/g,'l')
    .replace(/ń/g,'n').replace(/ó/g,'o').replace(/ś/g,'s').replace(/ź/g,'z').replace(/ż/g,'z')
    .replace(/[^a-z0-9]/g,'');
}

function cuid() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return 'c' + ts + rand;
}

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  console.log('Połączono z bazą.\n');

  const pwHash = await bcrypt.hash(TEMP_PASSWORD, 10);

  // 1. Sezon
  let sezonId;
  const existingSezon = await db.query('SELECT id FROM "Sezon" WHERE nazwa = $1', [SEZON_NAZWA]);
  if (existingSezon.rows.length > 0) {
    sezonId = existingSezon.rows[0].id;
    await db.query('UPDATE "Sezon" SET aktywny = true WHERE id = $1', [sezonId]);
    console.log(`Sezon "${SEZON_NAZWA}" już istnieje (id: ${sezonId}) — ustawiono jako aktywny.`);
  } else {
    await db.query('UPDATE "Sezon" SET aktywny = false', []);
    sezonId = cuid();
    await db.query(
      'INSERT INTO "Sezon" (id, nazwa, aktywny, "createdAt") VALUES ($1,$2,true,$3)',
      [sezonId, SEZON_NAZWA, new Date()]
    );
    console.log(`Sezon "${SEZON_NAZWA}" utworzony (id: ${sezonId}).`);
  }

  console.log('');

  // 2. Gracze
  for (const z of zawodnicy) {
    const { imieNazwisko, login: baseLogin } = toImieNazwisko(z.nazwiskoImie);

    // Szukaj istniejącego Player po imieNazwisko (DB format)
    const existing = await db.query(
      'SELECT p.id as "playerId", p."userId" FROM "Player" p WHERE p."imieNazwisko" = $1',
      [imieNazwisko]
    );

    let playerId;

    if (existing.rows.length > 0) {
      playerId = existing.rows[0].playerId;
      // Aktualizuj foto i pseudonim jeśli brak
      await db.query(
        'UPDATE "Player" SET foto = COALESCE(foto, $1), pseudonim = COALESCE(NULLIF(pseudonim,\'\'), $2), "updatedAt" = $3 WHERE id = $4',
        [z.foto, z.pseudonim || null, new Date(), playerId]
      );
      console.log(`✓ Istniejący: ${imieNazwisko}`);
    } else {
      // Nowy użytkownik — unikalny login
      let login = baseLogin;
      const loginCheck = await db.query('SELECT id FROM "User" WHERE login = $1', [login]);
      if (loginCheck.rows.length > 0) login = login + '2';

      const userId = cuid();
      playerId = cuid();

      await db.query(
        `INSERT INTO "User" (id, login, email, password, role, active, "mustChangePassword", "createdAt", "updatedAt")
         VALUES ($1, $2, NULL, $3, 'PLAYER', true, true, $4, $4)`,
        [userId, login, pwHash, new Date()]
      );

      await db.query(
        `INSERT INTO "Player" (id, "userId", "imieNazwisko", pozycja, numer, foto, pseudonim, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $7)`,
        [playerId, userId, imieNazwisko, z.pozycja, z.foto, z.pseudonim || null, new Date()]
      );

      console.log(`+ Nowy:       ${imieNazwisko} (login: ${login})`);
    }

    // SezonStats — upsert
    const statsExist = await db.query(
      'SELECT id FROM "SezonStats" WHERE "playerId" = $1 AND "sezonId" = $2',
      [playerId, sezonId]
    );

    if (statsExist.rows.length > 0) {
      await db.query(
        `UPDATE "SezonStats" SET mecze=$1, gole=$2, asysty=$3, zolte=$4, czerwone=$5,
         "meczePuchar"=$6, "golePuchar"=$7, "updatedAt"=$8
         WHERE "playerId"=$9 AND "sezonId"=$10`,
        [z.mecze, z.gole, z.asysty, z.zolte, z.czerwone, z.meczePuchar, z.golePuchar, new Date(), playerId, sezonId]
      );
    } else {
      const statsId = cuid();
      await db.query(
        `INSERT INTO "SezonStats" (id, "playerId", "sezonId", mecze, gole, asysty, zolte, czerwone, "meczePuchar", "golePuchar", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [statsId, playerId, sezonId, z.mecze, z.gole, z.asysty, z.zolte, z.czerwone, z.meczePuchar, z.golePuchar, new Date()]
      );
    }
  }

  console.log('\nGotowe!');
  console.log(`Hasło tymczasowe dla nowych kont: ${TEMP_PASSWORD}`);
  console.log('Gracze będą musieli je zmienić przy pierwszym logowaniu.');

  await db.end();
}

main().catch((e) => { console.error(e); process.exit(1); });

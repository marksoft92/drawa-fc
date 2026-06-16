-- Migracja: ankiety + push subscriptions
-- Uruchom na VPS: psql $DATABASE_URL -f ankiety_push.sql

CREATE TABLE IF NOT EXISTS "Ankieta" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "tytul"     TEXT NOT NULL,
  "pytanie"   TEXT NOT NULL,
  "deadline"  TIMESTAMP(3),
  "aktywna"   BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Ankieta_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AnkietaOpcja" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "ankietaId" TEXT NOT NULL,
  "tresc"     TEXT NOT NULL,
  "kolejnosc" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "AnkietaOpcja_ankietaId_fkey" FOREIGN KEY ("ankietaId") REFERENCES "Ankieta"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AnkietaGlos" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "ankietaId" TEXT NOT NULL,
  "opcjaId"   TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnkietaGlos_ankietaId_fkey" FOREIGN KEY ("ankietaId") REFERENCES "Ankieta"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AnkietaGlos_opcjaId_fkey"   FOREIGN KEY ("opcjaId")   REFERENCES "AnkietaOpcja"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AnkietaGlos_userId_fkey"    FOREIGN KEY ("userId")    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AnkietaGlos_ankietaId_userId_key" UNIQUE ("ankietaId", "userId")
);

CREATE TABLE IF NOT EXISTS "PushSubscription" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "userId"    TEXT NOT NULL,
  "endpoint"  TEXT NOT NULL,
  "p256dh"    TEXT NOT NULL,
  "auth"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PushSubscription_endpoint_key" UNIQUE ("endpoint")
);

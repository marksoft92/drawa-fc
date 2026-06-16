-- Migracja: czat wewnętrzny
-- Uruchom na VPS: psql 'postgresql://drawa:Freeasahorse1423@localhost:5432/drawa_fc' -f prisma/chat.sql

CREATE TABLE IF NOT EXISTS "ChatWiadomosc" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "tresc"     TEXT,
  "typ"       TEXT NOT NULL DEFAULT 'text',
  "plik"      TEXT,
  "authorId"  TEXT NOT NULL,
  "usunieta"  BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "editedAt"  TIMESTAMP(3),
  CONSTRAINT "ChatWiadomosc_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ChatReakcja" (
  "id"     TEXT NOT NULL PRIMARY KEY,
  "wiadId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "emoji"  TEXT NOT NULL,
  CONSTRAINT "ChatReakcja_wiadId_fkey" FOREIGN KEY ("wiadId") REFERENCES "ChatWiadomosc"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ChatReakcja_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ChatReakcja_wiadId_userId_emoji_key" UNIQUE ("wiadId", "userId", "emoji")
);

CREATE TABLE IF NOT EXISTS "ChatOdczytanie" (
  "userId"     TEXT NOT NULL PRIMARY KEY,
  "ostatniaId" TEXT,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatOdczytanie_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

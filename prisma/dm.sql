-- Migracja: prywatne wiadomości 1-do-1
-- psql 'postgresql://drawa:Freeasahorse1423@localhost:5432/drawa_fc' -f prisma/dm.sql

CREATE TABLE IF NOT EXISTS "PrivateConversation" (
  "id"        TEXT         NOT NULL,
  "user1Id"   TEXT         NOT NULL,
  "user2Id"   TEXT         NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrivateConversation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PrivateConversation_user1Id_fkey"
    FOREIGN KEY ("user1Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PrivateConversation_user2Id_fkey"
    FOREIGN KEY ("user2Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PrivateConversation_user1Id_user2Id_key"
  ON "PrivateConversation"("user1Id","user2Id");

CREATE TABLE IF NOT EXISTS "PrivateWiadomosc" (
  "id"        TEXT         NOT NULL,
  "convId"    TEXT         NOT NULL,
  "authorId"  TEXT         NOT NULL,
  "tresc"     TEXT,
  "typ"       TEXT         NOT NULL DEFAULT 'text',
  "plik"      TEXT,
  "usunieta"  BOOLEAN      NOT NULL DEFAULT false,
  "replyToId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "editedAt"  TIMESTAMP(3),
  CONSTRAINT "PrivateWiadomosc_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PrivateWiadomosc_convId_fkey"
    FOREIGN KEY ("convId") REFERENCES "PrivateConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PrivateWiadomosc_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PrivateWiadomosc_replyToId_fkey"
    FOREIGN KEY ("replyToId") REFERENCES "PrivateWiadomosc"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PrivateReakcja" (
  "id"     TEXT NOT NULL,
  "wiadId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "emoji"  TEXT NOT NULL,
  CONSTRAINT "PrivateReakcja_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PrivateReakcja_wiadId_fkey"
    FOREIGN KEY ("wiadId") REFERENCES "PrivateWiadomosc"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PrivateReakcja_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PrivateReakcja_wiadId_userId_emoji_key"
  ON "PrivateReakcja"("wiadId","userId","emoji");

CREATE TABLE IF NOT EXISTS "PrivateOdczytanie" (
  "convId"     TEXT         NOT NULL,
  "userId"     TEXT         NOT NULL,
  "ostatniaId" TEXT,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PrivateOdczytanie_pkey" PRIMARY KEY ("convId","userId"),
  CONSTRAINT "PrivateOdczytanie_convId_fkey"
    FOREIGN KEY ("convId") REFERENCES "PrivateConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PrivateOdczytanie_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

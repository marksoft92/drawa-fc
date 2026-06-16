-- Migracja: odpowiedzi na wiadomości
-- psql 'postgresql://drawa:Freeasahorse1423@localhost:5432/drawa_fc' -f prisma/reply.sql

ALTER TABLE "ChatWiadomosc"
  ADD COLUMN IF NOT EXISTS "replyToId" TEXT,
  ADD CONSTRAINT IF NOT EXISTS "ChatWiadomosc_replyToId_fkey"
    FOREIGN KEY ("replyToId") REFERENCES "ChatWiadomosc"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migracja: lastSeen dla statusu online
-- psql 'postgresql://drawa:Freeasahorse1423@localhost:5432/drawa_fc' -f prisma/lastseen.sql

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSeen" TIMESTAMP(3);

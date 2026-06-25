-- Dodaje pole tags do tabeli WpisLigowy
ALTER TABLE "WpisLigowy" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT '{}';

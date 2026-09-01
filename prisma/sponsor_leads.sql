-- Migracja: CRM pozyskiwania sponsorów
-- Uruchom na VPS: psql 'postgresql://drawa:Freeasahorse1423@localhost:5432/drawa_fc' -f prisma/sponsor_leads.sql

CREATE TABLE IF NOT EXISTS "SponsorLead" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "nazwa"           TEXT NOT NULL,
  "osobaKontaktowa" TEXT,
  "telefon"         TEXT,
  "email"           TEXT,
  "www"             TEXT,
  "adres"           TEXT,
  "zrodlo"          TEXT,
  "status"          TEXT NOT NULL DEFAULT 'NOWY',
  "wartosc"         INTEGER,
  "nastepnyKontakt" TIMESTAMP(3),
  "sponsorId"       TEXT UNIQUE,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SponsorLead_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SponsorLead_status_idx" ON "SponsorLead"("status");

CREATE TABLE IF NOT EXISTS "SponsorLeadNote" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "leadId"    TEXT NOT NULL,
  "tresc"     TEXT NOT NULL,
  "authorId"  TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SponsorLeadNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "SponsorLead"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SponsorLeadNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SponsorLeadNote_leadId_idx" ON "SponsorLeadNote"("leadId");

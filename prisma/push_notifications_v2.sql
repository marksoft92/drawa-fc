-- Pozwala na anonimowe subskrypcje push (kibice bez konta gracza), nie tylko zalogowani
ALTER TABLE "PushSubscription" ALTER COLUMN "userId" DROP NOT NULL;

-- Dedup flagi dla automatycznych powiadomień push
ALTER TABLE "Mecz" ADD COLUMN IF NOT EXISTS "notified1h" BOOLEAN NOT NULL DEFAULT false;

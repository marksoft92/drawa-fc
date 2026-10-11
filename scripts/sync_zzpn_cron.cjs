/**
 * Synchronizacja ligi z rozgrywki.zzpn.pl (terminarz, wyniki, tabela, składy, przebieg meczów)
 * — uruchamiana z crona na serwerze w niedzielę o 20:00. Całą pracę wykonuje aplikacja
 * (lib/zzpnSync.js), ten skrypt tylko ją wywołuje i zapisuje wynik w logu.
 *
 * Uruchomienie ręczne:
 *   node scripts/sync_zzpn_cron.cjs          # synchronizacja
 *   node scripts/sync_zzpn_cron.cjs --dry    # tylko plan zmian, bez zapisu do bazy
 *
 * Wymaga AGENT_TOKEN w .env.local i działającej aplikacji (pm2: drawa-fc).
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const SITE = process.env.SYNC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`;
const dry = process.argv.includes("--dry");

(async () => {
  const stamp = new Date().toISOString();
  if (!process.env.AGENT_TOKEN) { console.error(`[${stamp}] Brak AGENT_TOKEN w .env.local`); process.exit(1); }
  const r = await fetch(`${SITE}/api/cron/zzpn${dry ? "?dry=1" : ""}`, {
    method: "POST",
    headers: { "x-agent-token": process.env.AGENT_TOKEN },
  });
  const body = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
  console.log(`[${stamp}] ${r.ok ? "OK" : "BŁĄD"} ${JSON.stringify(body, null, dry ? 2 : 0)}`);
  if (!r.ok) process.exit(1);
})().catch((e) => { console.error(`[${new Date().toISOString()}] BŁĄD ${e.message}`); process.exit(1); });

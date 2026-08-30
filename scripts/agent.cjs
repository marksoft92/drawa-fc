/**
 * Drawa Drawno — lokalny agent scrapera
 *
 * Regiowyniki.pl blokuje (Cloudflare 403) pobieranie składów meczowych
 * z adresu IP serwera (VPS). Ten agent działa na Twoim komputerze (inny,
 * niezablokowany adres IP), odpytuje panel o zlecenia scrapowania,
 * odpala lokalnie scraper_v5.cjs i odsyła wynik z powrotem na serwer.
 *
 * Uruchomienie:
 *   node scripts/agent.cjs
 *
 * Wymaga AGENT_TOKEN w .env.local (ten sam token, co w .env.local na VPS).
 * Zostaw uruchomiony w terminalu — odpytuje co POLL_INTERVAL sekund.
 * Ctrl+C żeby zatrzymać.
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const SITE = process.env.AGENT_SITE_URL || "https://mksdrawadrawno.pl";
const TOKEN = process.env.AGENT_TOKEN;
const POLL_INTERVAL = 20_000;
const ROOT = path.join(__dirname, "..");
const OUTPUT_FILE = path.join(ROOT, "tmp", "scraper_output.json");

if (!TOKEN) {
  console.error("❌ Brak AGENT_TOKEN w .env.local — dodaj taki sam token, jak w .env.local na serwerze.");
  process.exit(1);
}

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString("pl-PL")}] ${msg}`);
}

async function checkJob() {
  const r = await fetch(`${SITE}/api/agent/scraper`, {
    headers: { "x-agent-token": TOKEN },
  });
  if (!r.ok) throw new Error(`GET /api/agent/scraper → ${r.status}`);
  return r.json();
}

async function reportProgress(progress) {
  try {
    await fetch(`${SITE}/api/agent/scraper`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-agent-token": TOKEN },
      body: JSON.stringify({ progress }),
    });
  } catch { /* nieistotne, spróbujemy przy następnym update */ }
}

async function reportResult(result) {
  const r = await fetch(`${SITE}/api/agent/scraper`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-agent-token": TOKEN },
    body: JSON.stringify({ result }),
  });
  if (!r.ok) throw new Error(`POST /api/agent/scraper → ${r.status}`);
}

async function reportError(error) {
  await fetch(`${SITE}/api/agent/scraper`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-agent-token": TOKEN },
    body: JSON.stringify({ error }),
  }).catch(() => {});
}

const SCRAPERS = {
  regiowyniki: "scraper_v5.cjs",
  zzpn: "scraper_zzpn.cjs",
};

function runScraper(source) {
  return new Promise((resolve, reject) => {
    const scraperFile = SCRAPERS[source] || SCRAPERS.regiowyniki;
    const scraperPath = path.join(ROOT, "scripts", scraperFile);
    const proc = spawn(process.execPath, [scraperPath], { cwd: ROOT, stdio: "inherit" });
    proc.on("close", (code) => {
      if (code === 0) resolve(); else reject(new Error(`${scraperFile} zakończył się kodem ${code}`));
    });
    proc.on("error", reject);
  });
}

async function runJob(source) {
  log(`📥 Odebrano zlecenie (źródło: ${source}) — odpalam ${SCRAPERS[source] || SCRAPERS.regiowyniki} lokalnie...`);
  await reportProgress("Agent uruchomił scraper lokalnie...");
  try {
    await runScraper(source);
    const result = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
    log(`📤 Wysyłam wynik na serwer (${result.mecze?.length || 0} meczów, ${result.tabela?.length || 0} drużyn w tabeli)...`);
    await reportResult(result);
    log("✅ Gotowe, wynik zapisany na serwerze.");
  } catch (e) {
    log(`❌ Błąd: ${e.message}`);
    await reportError(e.message);
  }
}

async function loop() {
  log(`👀 Agent nasłuchuje (${SITE}) — sprawdzam co ${POLL_INTERVAL / 1000}s...`);
  for (;;) {
    try {
      const { job, source } = await checkJob();
      if (job) await runJob(source);
    } catch (e) {
      log(`⚠️  Błąd komunikacji z serwerem: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }
}

loop();

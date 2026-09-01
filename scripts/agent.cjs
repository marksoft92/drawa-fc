/**
 * Drawa Drawno — lokalny agent scrapera i skanera leadów
 *
 * Regiowyniki.pl blokuje (Cloudflare 403) pobieranie składów meczowych
 * z adresu IP serwera (VPS). Overpass (skan leadów sponsorskich z OSM) też
 * mocniej dławi ruch z adresów datacenter/VPS niż z domowych łączy. Ten agent
 * działa na Twoim komputerze (inny, niezablokowany adres IP), odpytuje panel
 * o zlecenia (scraper meczów, skan powiatu), odpala je lokalnie i odsyła
 * wynik z powrotem na serwer.
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

if (!TOKEN) {
  console.error("❌ Brak AGENT_TOKEN w .env.local — dodaj taki sam token, jak w .env.local na serwerze.");
  process.exit(1);
}

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString("pl-PL")}] ${msg}`);
}

async function checkJob(endpoint) {
  const r = await fetch(`${SITE}${endpoint}`, { headers: { "x-agent-token": TOKEN } });
  if (!r.ok) throw new Error(`GET ${endpoint} → ${r.status}`);
  return r.json();
}

async function reportProgress(endpoint, progress) {
  try {
    await fetch(`${SITE}${endpoint}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-agent-token": TOKEN },
      body: JSON.stringify({ progress }),
    });
  } catch { /* nieistotne, spróbujemy przy następnym update */ }
}

async function reportResult(endpoint, result) {
  const r = await fetch(`${SITE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-agent-token": TOKEN },
    body: JSON.stringify({ result }),
  });
  if (!r.ok) throw new Error(`POST ${endpoint} → ${r.status}`);
}

async function reportError(endpoint, error) {
  await fetch(`${SITE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-agent-token": TOKEN },
    body: JSON.stringify({ error }),
  }).catch(() => {});
}

function runChild(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [scriptPath, ...args], { cwd: ROOT, stdio: "inherit" });
    proc.on("close", (code) => {
      if (code === 0) resolve(); else reject(new Error(`${path.basename(scriptPath)} zakończył się kodem ${code}`));
    });
    proc.on("error", reject);
  });
}

const SCRAPERS = {
  regiowyniki: "scraper_v5.cjs",
  zzpn: "scraper_zzpn.cjs",
};

// Każdy typ zlecenia: gdzie pytać o pracę, jak ją odpalić lokalnie i gdzie
// wylądował wynik do odczytania i odesłania na serwer.
const JOB_TYPES = [
  {
    label: "scraper",
    endpoint: "/api/agent/scraper",
    outputFile: path.join(ROOT, "tmp", "scraper_output.json"),
    describeJob: (job) => `źródło: ${job.source}`,
    run: (job) => runChild(path.join(ROOT, "scripts", SCRAPERS[job.source] || SCRAPERS.regiowyniki)),
    describeResult: (result) => `${result.mecze?.length || 0} meczów, ${result.tabela?.length || 0} drużyn w tabeli`,
  },
  {
    label: "skanuj",
    endpoint: "/api/agent/skanuj",
    outputFile: path.join(ROOT, "tmp", "scan_powiat_output.json"),
    describeJob: (job) => `powiat: ${job.powiat}`,
    run: (job) => runChild(path.join(ROOT, "scripts", "scan_powiat_local.cjs"), [job.powiat]),
    describeResult: (result) => `${result.results?.length || 0} firm`,
  },
];

async function runJob(type, job) {
  log(`📥 Odebrano zlecenie [${type.label}] (${type.describeJob(job)}) — odpalam lokalnie...`);
  await reportProgress(type.endpoint, "Agent uruchomił zadanie lokalnie...");
  try {
    await type.run(job);
    const result = JSON.parse(fs.readFileSync(type.outputFile, "utf-8"));
    log(`📤 Wysyłam wynik na serwer (${type.describeResult(result)})...`);
    await reportResult(type.endpoint, result);
    log("✅ Gotowe, wynik zapisany na serwerze.");
  } catch (e) {
    log(`❌ Błąd [${type.label}]: ${e.message}`);
    await reportError(type.endpoint, e.message);
  }
}

async function loop() {
  log(`👀 Agent nasłuchuje (${SITE}) — sprawdzam co ${POLL_INTERVAL / 1000}s...`);
  for (;;) {
    for (const type of JOB_TYPES) {
      try {
        const job = await checkJob(type.endpoint);
        if (job.job) await runJob(type, job);
      } catch (e) {
        log(`⚠️  Błąd komunikacji z serwerem [${type.label}]: ${e.message}`);
      }
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }
}

loop();

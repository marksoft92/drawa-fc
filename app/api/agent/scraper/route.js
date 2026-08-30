import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Endpoint dla lokalnego agenta (scripts/agent.cjs) — odpytuje o zlecenia scrapowania
// i odsyła wynik. Serwer (VPS) sam nie odpala scrapera, bo jego adres IP jest
// blokowany przez Cloudflare przy pobieraniu składów z regiowyniki.pl.

function getTmpDir() { return path.join(process.cwd(), "tmp"); }
function getStatusFile() { return path.join(getTmpDir(), "scraper_status.json"); }
function getOutputFile() { return path.join(getTmpDir(), "scraper_output.json"); }

function ensureTmp() {
  const dir = getTmpDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function readStatus() {
  try { return JSON.parse(readFileSync(getStatusFile(), "utf8")); }
  catch { return { status: "idle", progress: null, startedAt: null, finishedAt: null, stats: null }; }
}

function writeStatus(data) {
  ensureTmp();
  writeFileSync(getStatusFile(), JSON.stringify(data, null, 2));
}

function checkAuth(request) {
  const token = request.headers.get("x-agent-token");
  return !!token && token === process.env.AGENT_TOKEN;
}

// Agent pyta: czy jest zlecenie do wykonania?
export async function GET(request) {
  if (!checkAuth(request)) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const status = readStatus();
  if (status.status !== "queued") return Response.json({ job: false });

  // Agent przejmuje zlecenie — od razu oznacz jako "running", żeby inny
  // ewentualny agent (lub odświeżenie panelu) nie przejął go drugi raz.
  writeStatus({ ...status, status: "running", progress: "Agent pobrał zlecenie, scrapuję...", claimedAt: new Date().toISOString() });
  return Response.json({ job: true, source: status.source || "regiowyniki" });
}

// Agent może w trakcie pracy zaktualizować progres widoczny w panelu.
export async function PATCH(request) {
  if (!checkAuth(request)) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { progress } = await request.json();
  const status = readStatus();
  if (status.status === "running") writeStatus({ ...status, progress: progress || status.progress });
  return Response.json({ ok: true });
}

// Agent odsyła gotowy wynik (albo błąd).
export async function POST(request) {
  if (!checkAuth(request)) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const body = await request.json();

  if (body.error) {
    const status = readStatus();
    writeStatus({ ...status, status: "error", finishedAt: new Date().toISOString(), progress: `Błąd agenta: ${body.error}` });
    return Response.json({ ok: true });
  }

  ensureTmp();
  writeFileSync(getOutputFile(), JSON.stringify(body.result, null, 2), "utf-8");

  const stats = {
    tabela: body.result?.tabela?.length || 0,
    mecze: body.result?.mecze?.length || 0,
    scraped_at: body.result?.scraped_at || new Date().toISOString(),
  };
  writeStatus({ status: "done", finishedAt: new Date().toISOString(), progress: "Gotowe!", stats });

  return Response.json({ ok: true });
}

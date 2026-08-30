import { hasAccess } from "@/lib/auth";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// All paths computed inside functions so webpack doesn't trace them as module deps
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

export async function GET() {
  if (!(await hasAccess("scraper"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const status = readStatus();
  let data = null;
  const outputFile = getOutputFile();
  if (existsSync(outputFile)) {
    try {
      const raw = JSON.parse(readFileSync(outputFile, "utf8"));
      data = { tabela: raw.tabela || [], mecze: raw.mecze || [], scraped_at: raw.scraped_at };
    } catch {}
  }
  return Response.json({ ...status, data });
}

// Serwer (VPS) nie odpala scrapera sam — regiowyniki.pl blokuje jego adres IP
// przy pobieraniu składów (Cloudflare 403 na /ajax/matchPlayers.php). Zamiast
// tego zlecenie czeka w kolejce, aż odbierze je lokalny agent (scripts/agent.cjs)
// uruchomiony na komputerze z niezablokowanym adresem IP — patrz /api/agent/scraper.
export async function POST(request) {
  if (!(await hasAccess("scraper"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const status = readStatus();
  if (status.status === "running" || status.status === "queued") {
    return Response.json({ error: "Scraper już działa" }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const source = body?.source === "zzpn" ? "zzpn" : "regiowyniki";

  writeStatus({ status: "queued", source, startedAt: new Date().toISOString(), progress: "Oczekiwanie na agenta...", finishedAt: null, stats: null });

  return Response.json({ ok: true });
}

export async function DELETE() {
  if (!(await hasAccess("scraper"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  writeStatus({ status: "idle", progress: null, startedAt: null, finishedAt: null, stats: null });
  return Response.json({ ok: true });
}

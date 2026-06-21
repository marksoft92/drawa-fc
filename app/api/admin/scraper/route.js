import { hasAccess } from "@/lib/auth";
import { spawn } from "child_process";
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

export async function POST() {
  if (!(await hasAccess("scraper"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const status = readStatus();
  if (status.status === "running") return Response.json({ error: "Scraper już działa" }, { status: 409 });

  writeStatus({ status: "running", startedAt: new Date().toISOString(), progress: "Uruchamianie...", finishedAt: null, stats: null });

  // Compute path at runtime to avoid Next.js build-time module tracing
  const cwd = process.cwd();
  const scriptSegments = ["scripts", "scraper_v5.cjs"];
  const scriptPath = path.join(cwd, ...scriptSegments);

  const proc = spawn(process.execPath, [scriptPath], { cwd, detached: true, stdio: "ignore" });
  proc.on("close", (code) => {
    if (code === 0) return;
    const s = readStatus();
    writeStatus({ ...s, status: "error", finishedAt: new Date().toISOString(), progress: `Błąd (kod ${code})` });
  });
  proc.unref();

  return Response.json({ ok: true });
}

export async function DELETE() {
  if (!(await hasAccess("scraper"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  writeStatus({ status: "idle", progress: null, startedAt: null, finishedAt: null, stats: null });
  return Response.json({ ok: true });
}

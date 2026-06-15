import { isAdmin } from "@/lib/auth";
import { spawn } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const ROOT = process.cwd();
const TMP_DIR = path.join(ROOT, "tmp");
const STATUS_FILE = path.join(TMP_DIR, "scraper_status.json");
const OUTPUT_FILE = path.join(TMP_DIR, "scraper_output.json");

function ensureTmp() {
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });
}

function readStatus() {
  try { return JSON.parse(readFileSync(STATUS_FILE, "utf8")); }
  catch { return { status: "idle", progress: null, startedAt: null, finishedAt: null, stats: null }; }
}

function writeStatus(data) {
  ensureTmp();
  writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const status = readStatus();
  let data = null;
  if (existsSync(OUTPUT_FILE)) {
    try {
      const raw = JSON.parse(readFileSync(OUTPUT_FILE, "utf8"));
      data = { tabela: raw.tabela || [], mecze: raw.mecze || [], scraped_at: raw.scraped_at };
    } catch {}
  }
  return Response.json({ ...status, data });
}

export async function POST() {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const status = readStatus();
  if (status.status === "running") return Response.json({ error: "Scraper już działa" }, { status: 409 });

  writeStatus({ status: "running", startedAt: new Date().toISOString(), progress: "Uruchamianie...", finishedAt: null, stats: null });

  const scriptPath = path.join(ROOT, "scripts", "scraper_v5.cjs");
  const proc = spawn("node", [scriptPath], { cwd: ROOT, detached: true, stdio: "ignore" });
  proc.on("close", (code) => {
    const s = readStatus();
    if (code === 0) return;
    writeStatus({ ...s, status: "error", finishedAt: new Date().toISOString(), progress: `Błąd (kod ${code})` });
  });
  proc.unref();

  return Response.json({ ok: true });
}

export async function DELETE() {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  writeStatus({ status: "idle", progress: null, startedAt: null, finishedAt: null, stats: null });
  return Response.json({ ok: true });
}

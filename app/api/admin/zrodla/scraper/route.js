import { hasAccess } from "@/lib/auth";
import { spawn } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function getTmpDir() { return path.join(process.cwd(), "tmp"); }
function getStatusFile() { return path.join(getTmpDir(), "scraper_fb_status.json"); }

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
  if (!(await hasAccess("zrodla"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  return Response.json(readStatus());
}

export async function POST() {
  if (!(await hasAccess("zrodla"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const status = readStatus();
  if (status.status === "running") return Response.json({ error: "Scraper już działa" }, { status: 409 });

  writeStatus({ status: "running", startedAt: new Date().toISOString(), progress: "Uruchamianie...", finishedAt: null, stats: null });

  const cwd = process.cwd();
  const scriptPath = path.join(cwd, "scripts", "scraper_fb.cjs");

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
  if (!(await hasAccess("zrodla"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  writeStatus({ status: "idle", progress: null, startedAt: null, finishedAt: null, stats: null });
  return Response.json({ ok: true });
}

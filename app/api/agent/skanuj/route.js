import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Endpoint dla lokalnego agenta (scripts/agent.cjs) — odpytuje o zlecenia
// skanowania powiatów przez Overpass (OpenStreetMap) i odsyła wynik. Overpass
// mocniej dławi ruch z adresów datacenter/VPS niż z domowych łączy, więc skan
// odbywa się lokalnie — analogicznie do scrapera regiowyniki (/api/agent/scraper).

function getTmpDir() { return path.join(process.cwd(), "tmp"); }
function getStatusFile() { return path.join(getTmpDir(), "scan_powiat_status.json"); }

function ensureTmp() {
  const dir = getTmpDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function readStatus() {
  try { return JSON.parse(readFileSync(getStatusFile(), "utf8")); }
  catch { return { status: "idle" }; }
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

  writeStatus({ ...status, status: "running", progress: "Agent pobrał zlecenie, skanuję...", claimedAt: new Date().toISOString() });
  return Response.json({ job: true, powiat: status.powiat });
}

// Agent może w trakcie pracy zaktualizować progres widoczny w panelu.
export async function PATCH(request) {
  if (!checkAuth(request)) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { progress } = await request.json();
  const status = readStatus();
  if (status.status === "running") writeStatus({ ...status, progress: progress || status.progress });
  return Response.json({ ok: true });
}

// Agent odsyła gotowy wynik (albo błąd). Deduplikacja ze znanymi leadami/
// sponsorami dzieje się tutaj, bo baza jest dostępna tylko z serwera.
export async function POST(request) {
  if (!checkAuth(request)) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const body = await request.json();
  const status = readStatus();

  // Skan mógł zostać anulowany z panelu, zanim agent odesłał wynik — nie
  // nadpisuj wtedy stanu idle/nowego zlecenia spóźnionym wynikiem.
  if (status.status !== "running") return Response.json({ ok: true, discarded: true });

  if (body.error) {
    writeStatus({ ...status, status: "error", finishedAt: new Date().toISOString(), error: body.error });
    return Response.json({ ok: true });
  }

  const rawResults = body.result?.results || [];

  const [leady, sponsorzy] = await Promise.all([
    prisma.sponsorLead.findMany({ select: { nazwa: true } }),
    prisma.sponsor.findMany({ select: { nazwa: true } }),
  ]);
  const known = new Set([
    ...leady.map(r => r.nazwa.toLowerCase().trim()),
    ...sponsorzy.map(r => r.nazwa.toLowerCase().trim()),
  ]);

  const results = rawResults
    .map(t => ({ ...t, status: known.has(t.nazwa.toLowerCase().trim()) ? "exists" : "pending" }))
    .sort((a, b) => a.nazwa.localeCompare(b.nazwa, "pl"));

  writeStatus({
    status: "done",
    startedAt: status.startedAt,
    finishedAt: new Date().toISOString(),
    powiat: status.powiat,
    results,
  });

  return Response.json({ ok: true });
}

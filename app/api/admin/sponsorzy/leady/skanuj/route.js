import { hasAccess } from "@/lib/auth";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Powiaty w promieniu rozsądnego dojazdu od Drawna — pod dane z OpenStreetMap
// (nazwa musi się zgadzać z tagiem "name" granicy administracyjnej w OSM).
const POWIATY = [
  "powiat choszczeński",
  "powiat myśliborski",
  "powiat pyrzycki",
  "powiat stargardzki",
  "powiat drawski",
  "powiat wałecki",
  "powiat strzelecko-drezdenecki",
];

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

export async function GET() {
  if (!(await hasAccess("sponsorzy"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  return Response.json(POWIATY);
}

// Serwer (VPS) sam nie skrobie Google Maps — to automatyzacja przeglądarki
// (Playwright), która ma dużo mniejsze ryzyko zablokowania z domowego IP niż
// z adresu datacenter/VPS. Zlecenie czeka więc w kolejce, aż odbierze je
// lokalny agent (scripts/agent.cjs) — patrz /api/agent/skanuj.
// Klient odpytuje status przez /skanuj/status.
export async function POST(request) {
  if (!(await hasAccess("sponsorzy"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  let powiat;
  try {
    ({ powiat } = await request.json());
  } catch {
    return Response.json({ error: "Niepoprawne dane żądania" }, { status: 400 });
  }
  if (!POWIATY.includes(powiat)) return Response.json({ error: "Nieznany powiat" }, { status: 400 });

  const status = readStatus();
  if (status.status === "running" || status.status === "queued") {
    return Response.json({ error: "Skan już trwa" }, { status: 409 });
  }

  writeStatus({ status: "queued", startedAt: new Date().toISOString(), powiat, progress: "Oczekiwanie na agenta..." });

  return Response.json({ ok: true });
}

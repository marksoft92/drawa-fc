import { hasAccess } from "@/lib/auth";
import { spawn } from "child_process";
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

// Skan trwa nawet kilka minut (Overpass bywa przeciążony, próbujemy kilku
// instancji w rundach z odczekaniem) — dlatego działa jako osobny, odpięty
// od żądania HTTP proces w tle (jak scraper/batch-rewrite), a nie
// synchronicznie w tym handlerze. Klient odpytuje status przez /skanuj/status.
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
  if (status.status === "running") return Response.json({ error: "Skan już trwa" }, { status: 409 });

  writeStatus({ status: "running", startedAt: new Date().toISOString(), powiat, progress: "Uruchamianie..." });

  const cwd = process.cwd();
  const scriptPath = path.join(cwd, "scripts", "scan_powiat.cjs");
  const proc = spawn(process.execPath, [scriptPath, powiat], { cwd, detached: true, stdio: "ignore" });
  proc.on("close", (code) => {
    if (code === 0) return;
    const s = readStatus();
    if (s.status === "running") {
      writeStatus({ ...s, status: "error", finishedAt: new Date().toISOString(), error: `Błąd (kod ${code})` });
    }
  });
  proc.unref();

  return Response.json({ ok: true });
}

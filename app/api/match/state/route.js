import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { hasAccess } from "@/lib/auth";

const FILE = join(process.cwd(), "match-state.json");

const DEFAULT = {
  active: false,
  homeTeam: "MKS Drawa",
  awayTeam: "Rywal",
  homeScore: 0,
  awayScore: 0,
  timerRunning: false,
  timerStartedAt: null,
  timerOffset: 0,
  half: "1",
};

function read() {
  try { return { ...DEFAULT, ...JSON.parse(readFileSync(FILE, "utf8")) }; }
  catch { return { ...DEFAULT }; }
}

export async function GET() {
  return Response.json(read());
}

export async function POST(req) {
  if (!(await hasAccess("transmisja"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const body = await req.json();
  const next = { ...read(), ...body };
  writeFileSync(FILE, JSON.stringify(next), "utf8");
  return Response.json({ ok: true });
}

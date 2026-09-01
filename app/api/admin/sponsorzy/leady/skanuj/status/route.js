import { hasAccess } from "@/lib/auth";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

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
  return Response.json(readStatus());
}

// Zatrzymuje trwający skan (proces sam sprawdza status przed każdą próbą)
// i czyści status po zakończonym/błędnym skanie.
export async function DELETE() {
  if (!(await hasAccess("sponsorzy"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  writeStatus({ status: "idle" });
  return Response.json({ ok: true });
}

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { isAdmin } from "@/lib/auth";

const dataFile = join(process.cwd(), "stream-data.json");

function readStreamData() {
  try {
    return JSON.parse(readFileSync(dataFile, "utf8"));
  } catch {
    return { url: "", rotation: 0 };
  }
}

export async function GET() {
  const data = readStreamData();
  return Response.json({ url: data.url || "", rotation: data.rotation ?? 0 });
}

export async function POST(request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Brak dostępu" }, { status: 401 });
  }

  const body = await request.json();
  const current = readStreamData();
  const next = { ...current, ...body };
  writeFileSync(dataFile, JSON.stringify(next), "utf8");
  return Response.json({ ok: true });
}

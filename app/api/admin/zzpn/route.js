import { hasAccess } from "@/lib/auth";
import { readZzpnStatus, runZzpnSync } from "@/lib/zzpnSync";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  if (!(await hasAccess("scraper"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  return Response.json(readZzpnStatus());
}

export async function POST() {
  if (!(await hasAccess("scraper"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const r = await runZzpnSync({ zrodlo: "panel" });
  return Response.json(r, { status: r.ok ? 200 : r.busy ? 409 : 502 });
}

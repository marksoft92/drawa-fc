import { runZzpnSync } from "@/lib/zzpnSync";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Endpoint dla crona na serwerze (scripts/sync_zzpn_cron.cjs) — bez sesji, więc
// autoryzacja tokenem, tym samym co lokalny agent (/api/agent/*).
// ?dry=1 zwraca plan zmian bez zapisu do bazy.
export async function POST(request) {
  const token = request.headers.get("x-agent-token");
  if (!token || token !== process.env.AGENT_TOKEN) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const dryRun = new URL(request.url).searchParams.get("dry") === "1";
  const r = await runZzpnSync({ zrodlo: "cron", dryRun });
  return Response.json(r, { status: r.ok ? 200 : r.busy ? 409 : 502 });
}

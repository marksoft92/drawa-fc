export const dynamic = "force-dynamic";

export async function POST(request) {
  const text = await request.text();

  console.log("[health-webhook] headers:", JSON.stringify(Object.fromEntries(request.headers)));
  console.log("[health-webhook] body:", text);

  return Response.json({ ok: true });
}

export async function GET() {
  return Response.json({ ok: true, message: "health-webhook alive" });
}

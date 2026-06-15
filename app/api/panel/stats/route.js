import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const playerId = session.user.player?.id;
  if (!playerId) return Response.json({ error: "Brak profilu gracza" }, { status: 404 });

  const sezon = await prisma.sezon.findFirst({ where: { aktywny: true } });
  if (!sezon) return Response.json({ sezon: null, stats: null });

  const stats = await prisma.sezonStats.findUnique({
    where: { playerId_sezonId: { playerId, sezonId: sezon.id } },
  });

  return Response.json({ sezon: sezon.nazwa, stats });
}

export async function PATCH(request) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const playerId = session.user.player?.id;
  if (!playerId) return Response.json({ error: "Brak profilu gracza" }, { status: 404 });

  const sezon = await prisma.sezon.findFirst({ where: { aktywny: true } });
  if (!sezon) return Response.json({ error: "Brak aktywnego sezonu" }, { status: 400 });

  const body = await request.json();
  const fields = ["mecze", "gole", "asysty", "zolte", "czerwone", "meczePuchar", "golePuchar"];
  const data = {};
  for (const f of fields) {
    if (body[f] !== undefined) data[f] = Math.max(0, Number(body[f]) || 0);
  }

  const stats = await prisma.sezonStats.upsert({
    where: { playerId_sezonId: { playerId, sezonId: sezon.id } },
    update: data,
    create: { playerId, sezonId: sezon.id, ...data },
  });

  return Response.json({ ok: true, stats });
}

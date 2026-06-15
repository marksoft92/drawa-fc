import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, include: { player: true } });
  if (!user?.player) return Response.json({ error: "Nie znaleziono gracza" }, { status: 404 });

  const stats = await prisma.sezonStats.findMany({
    where: { playerId: user.player.id },
    include: { sezon: true },
    orderBy: { sezon: { createdAt: "desc" } },
  });

  const sezony = await prisma.sezon.findMany({ orderBy: { createdAt: "desc" } });

  return Response.json({ stats, sezony });
}

export async function PATCH(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, include: { player: true } });
  if (!user?.player) return Response.json({ error: "Nie znaleziono gracza" }, { status: 404 });

  const playerId = user.player.id;
  const body = await request.json();
  const { sezonId, ...rest } = body;

  if (!sezonId) return Response.json({ error: "Podaj sezonId" }, { status: 400 });

  const fields = ["mecze", "gole", "asysty", "zolte", "czerwone", "meczePuchar", "golePuchar"];
  const data = {};
  for (const f of fields) {
    if (rest[f] !== undefined) data[f] = Math.max(0, Number(rest[f]) || 0);
  }

  const stats = await prisma.sezonStats.upsert({
    where: { playerId_sezonId: { playerId, sezonId } },
    update: data,
    create: { playerId, sezonId, ...data },
  });

  return Response.json({ ok: true, stats });
}

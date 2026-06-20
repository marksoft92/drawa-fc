import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const sezonId = new URL(request.url).searchParams.get("sezonId");
  if (!sezonId) return Response.json({ error: "Brak sezonId" }, { status: 400 });

  const kadra = await prisma.kadraSezon.findMany({
    where: { sezonId },
    select: { playerId: true },
  });

  return Response.json(kadra.map(k => k.playerId));
}

export async function POST(request) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { playerId, sezonId } = await request.json();
  if (!playerId || !sezonId) return Response.json({ error: "Brak danych" }, { status: 400 });

  await prisma.kadraSezon.upsert({
    where: { playerId_sezonId: { playerId, sezonId } },
    update: {},
    create: { playerId, sezonId },
  });

  return Response.json({ ok: true });
}

export async function DELETE(request) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { playerId, sezonId } = await request.json();
  if (!playerId || !sezonId) return Response.json({ error: "Brak danych" }, { status: 400 });

  await prisma.kadraSezon.deleteMany({ where: { playerId, sezonId } });

  return Response.json({ ok: true });
}

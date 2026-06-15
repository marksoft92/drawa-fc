import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { id } = await params;
  const { nazwa, aktywny } = await request.json();

  if (aktywny === true) {
    await prisma.sezon.updateMany({ data: { aktywny: false } });
  }

  const data = {};
  if (nazwa !== undefined) data.nazwa = nazwa.trim();
  if (aktywny !== undefined) data.aktywny = aktywny;

  const sezon = await prisma.sezon.update({ where: { id }, data });
  return Response.json(sezon);
}

export async function DELETE(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { id } = await params;
  const sezon = await prisma.sezon.findUnique({ where: { id }, include: { _count: { select: { stats: true } } } });
  if (!sezon) return Response.json({ error: "Nie znaleziono" }, { status: 404 });
  if (sezon.aktywny) return Response.json({ error: "Nie można usunąć aktywnego sezonu" }, { status: 400 });
  if (sezon._count.stats > 0) return Response.json({ error: "Sezon ma statystyki — usuń je najpierw" }, { status: 400 });

  await prisma.sezon.delete({ where: { id } });
  return Response.json({ ok: true });
}

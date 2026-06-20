import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const sezony = await prisma.sezon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { stats: true } } },
  });

  return Response.json(sezony);
}

export async function POST(request) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { nazwa, aktywny } = await request.json();
  if (!nazwa?.trim()) return Response.json({ error: "Podaj nazwę sezonu" }, { status: 400 });

  const exists = await prisma.sezon.findUnique({ where: { nazwa: nazwa.trim() } });
  if (exists) return Response.json({ error: "Sezon o tej nazwie już istnieje" }, { status: 409 });

  if (aktywny) {
    await prisma.sezon.updateMany({ data: { aktywny: false } });
  }

  const sezon = await prisma.sezon.create({ data: { nazwa: nazwa.trim(), aktywny: !!aktywny } });

  if (aktywny) {
    await prisma.ustawienie.upsert({
      where: { klucz: "aktywny_sezon" },
      update: { wartosc: sezon.nazwa },
      create: { klucz: "aktywny_sezon", wartosc: sezon.nazwa },
    });
  }

  return Response.json(sezon, { status: 201 });
}

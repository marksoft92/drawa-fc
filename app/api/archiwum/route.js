import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sezonId = searchParams.get("sezonId");

  if (sezonId) {
    const sezon = await prisma.archiwumSezon.findUnique({
      where: { id: sezonId },
      include: {
        mecze: { orderBy: [{ kolejka: "asc" }, { date: "asc" }] },
        tabela: { orderBy: { pozycja: "asc" } },
      },
    });
    if (!sezon) return Response.json({ error: "Nie znaleziono" }, { status: 404 });
    return Response.json(sezon);
  }

  const sezony = await prisma.archiwumSezon.findMany({
    orderBy: { sezon: "desc" },
    select: {
      id: true,
      sourceId: true,
      sezon: true,
      liga: true,
      _count: { select: { mecze: true, tabela: true } },
    },
  });

  return Response.json(sezony);
}

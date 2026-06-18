import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();

  const otwarte = await prisma.typowanie.findMany({
    where: { aktywne: true, wynikTeam1: null, dataRozpoczecia: { gt: now } },
    orderBy: { dataRozpoczecia: "asc" },
    include: { _count: { select: { wpisy: true } } },
  });

  const zakonczone = await prisma.typowanie.findMany({
    where: { wynikTeam1: { not: null } },
    orderBy: { dataRozpoczecia: "desc" },
    take: 10,
    include: {
      wpisy: { orderBy: [{ punkty: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }] },
    },
  });

  return Response.json({ otwarte, zakonczone });
}

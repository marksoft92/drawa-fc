import { prisma } from "@/lib/prisma";

export const revalidate = 120;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const skip = Number(searchParams.get("skip")) || 0;
  const zrodloId = searchParams.get("zrodloId");

  const where = { published: true };
  if (zrodloId) where.zrodloId = zrodloId;

  const [wpisy, total] = await Promise.all([
    prisma.wpisLigowy.findMany({
      where,
      include: { zrodlo: { select: { nazwa: true, herb: true } } },
      orderBy: { createdAt: "desc" },
      take: 24,
      skip,
    }),
    prisma.wpisLigowy.count({ where }),
  ]);
  return Response.json({ wpisy, total });
}

import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!(await hasAccess("zrodla"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const published = searchParams.get("published");
  const zrodloId = searchParams.get("zrodloId");
  const skip = Number(searchParams.get("skip")) || 0;

  const where = {};
  if (published !== null) where.published = published === "true";
  if (zrodloId) where.zrodloId = zrodloId;

  const [wpisy, total] = await Promise.all([
    prisma.wpisLigowy.findMany({
      where,
      include: { zrodlo: { select: { nazwa: true, herb: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
      skip,
    }),
    prisma.wpisLigowy.count({ where }),
  ]);
  return Response.json({ wpisy, total });
}

import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!(await hasAccess("sklep"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where = status ? { status } : {};
  const zamowienia = await prisma.zamowienie.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { pozycje: true } } },
  });
  return Response.json(zamowienia);
}

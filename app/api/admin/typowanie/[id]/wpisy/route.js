import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  if (!(await hasAccess("typowanie"))) return Response.json({ error: "Brak dostępu" }, { status: 403 });

  const { id } = await params;

  const wpisy = await prisma.typowanieWpis.findMany({
    where: { typowanieId: id },
    orderBy: [{ punkty: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }],
  });

  return Response.json(wpisy);
}

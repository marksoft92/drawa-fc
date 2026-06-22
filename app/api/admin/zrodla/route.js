import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAccess("zrodla"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const zrodla = await prisma.zrodloFB.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { wpisy: true } } },
  });
  return Response.json(zrodla);
}

export async function POST(request) {
  if (!(await hasAccess("zrodla"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { nazwa, fbUrl, herb } = await request.json();
  if (!nazwa?.trim() || !fbUrl?.trim()) return Response.json({ error: "Nazwa i URL FB są wymagane" }, { status: 400 });
  const zrodlo = await prisma.zrodloFB.create({
    data: {
      nazwa: nazwa.trim(),
      fbUrl: fbUrl.trim(),
      herb: herb?.trim() || null,
    },
  });
  return Response.json(zrodlo, { status: 201 });
}

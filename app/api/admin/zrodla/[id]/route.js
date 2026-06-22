import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  if (!(await hasAccess("zrodla"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const data = {};
  if (body.nazwa !== undefined) data.nazwa = body.nazwa.trim();
  if (body.fbUrl !== undefined) data.fbUrl = body.fbUrl.trim();
  if (body.herb !== undefined) data.herb = body.herb?.trim() || null;
  if (body.aktywne !== undefined) data.aktywne = body.aktywne;
  const zrodlo = await prisma.zrodloFB.update({ where: { id }, data });
  return Response.json(zrodlo);
}

export async function DELETE(request, { params }) {
  if (!(await hasAccess("zrodla"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  await prisma.zrodloFB.delete({ where: { id } });
  return Response.json({ ok: true });
}

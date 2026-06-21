import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  if (!(await hasAccess("liga"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const mecz = await prisma.mecz.findUnique({ where: { id } });
  if (!mecz) return Response.json({ error: "Nie znaleziono" }, { status: 404 });
  return Response.json(mecz);
}

export async function PATCH(request, { params }) {
  if (!(await hasAccess("liga"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const data = {};
  if (body.score !== undefined) data.score = body.score || null;
  if (body.status !== undefined) data.status = body.status || null;
  if (body.komentarz !== undefined) data.komentarz = body.komentarz || null;
  if (body.walkower !== undefined) data.walkower = Boolean(body.walkower);
  if (body.strzelcy !== undefined) data.strzelcy = body.strzelcy;
  if (body.kartki !== undefined) data.kartki = body.kartki;
  if (body.zmiany !== undefined) data.zmiany = body.zmiany;
  if (body.date !== undefined) data.date = body.date;
  const mecz = await prisma.mecz.update({ where: { id }, data });
  return Response.json(mecz);
}

export async function DELETE(request, { params }) {
  if (!(await hasAccess("liga"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  await prisma.mecz.delete({ where: { id } });
  return Response.json({ ok: true });
}

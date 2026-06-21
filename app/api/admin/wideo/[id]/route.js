import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  const data = {};
  if (body.url !== undefined) data.url = body.url.trim();
  if (body.tytul !== undefined) data.tytul = body.tytul.trim();
  if (body.opis !== undefined) data.opis = body.opis.trim();
  if (body.typ !== undefined) data.typ = body.typ;
  if (body.kolejnosc !== undefined) data.kolejnosc = Number(body.kolejnosc) || 0;
  if (body.published !== undefined) data.published = body.published;

  const wideo = await prisma.wideo.update({ where: { id }, data });
  return Response.json(wideo);
}

export async function DELETE(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  await prisma.wideo.delete({ where: { id } });
  return Response.json({ ok: true });
}

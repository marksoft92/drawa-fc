import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const album = await prisma.album.findUnique({ where: { id } });
  if (!album) return Response.json({ error: "Nie znaleziono" }, { status: 404 });
  return Response.json(album);
}

export async function PATCH(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const data = {};
  if (body.slug !== undefined) data.slug = body.slug.trim();
  if (body.tytul !== undefined) data.tytul = body.tytul.trim();
  if (body.date !== undefined) data.date = body.date;
  if (body.tags !== undefined) data.tags = body.tags;
  if (body.thumbnail !== undefined) data.thumbnail = body.thumbnail?.trim() || null;
  if (body.author !== undefined) data.author = body.author?.trim() || null;
  if (body.hrefAuthor !== undefined) data.hrefAuthor = body.hrefAuthor?.trim() || null;
  if (body.photos !== undefined) data.photos = body.photos;
  if (body.kolejnosc !== undefined) data.kolejnosc = Number(body.kolejnosc) || 0;
  if (body.published !== undefined) data.published = body.published;
  const album = await prisma.album.update({ where: { id }, data });
  return Response.json(album);
}

export async function DELETE(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  await prisma.album.delete({ where: { id } });
  return Response.json({ ok: true });
}

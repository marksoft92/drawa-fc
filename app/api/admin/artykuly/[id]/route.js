import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  if (!(await hasAccess("aktualnosci"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const a = await prisma.artykul.findUnique({ where: { id } });
  if (!a) return Response.json({ error: "Nie znaleziono" }, { status: 404 });
  return Response.json(a);
}

export async function PATCH(request, { params }) {
  if (!(await hasAccess("aktualnosci"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  const data = {};
  if (body.title !== undefined)     data.title     = body.title.trim();
  if (body.slug !== undefined)      data.slug      = body.slug.trim();
  if (body.excerpt !== undefined)   data.excerpt   = body.excerpt.trim();
  if (body.content !== undefined)   data.content   = body.content;
  if (body.thumbnail !== undefined) data.thumbnail = body.thumbnail?.trim() || null;
  if (body.kolor !== undefined)     data.kolor     = body.kolor?.trim() || null;
  if (body.tags !== undefined)      data.tags      = Array.isArray(body.tags) ? body.tags : [];
  if (body.photos !== undefined)    data.photos    = Array.isArray(body.photos) ? body.photos : [];
  if (body.published !== undefined) data.published = body.published;
  if (body.pinned !== undefined)    data.pinned    = body.pinned;
  if (body.podobne !== undefined)   data.podobne   = Array.isArray(body.podobne) ? body.podobne : [];
  if (body.date !== undefined)      data.date      = body.date;

  const artykul = await prisma.artykul.update({ where: { id }, data });
  return Response.json(artykul);
}

export async function DELETE(request, { params }) {
  if (!(await hasAccess("aktualnosci"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  await prisma.artykul.delete({ where: { id } });
  return Response.json({ ok: true });
}

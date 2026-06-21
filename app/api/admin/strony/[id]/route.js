import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  if (!(await hasAccess("strony"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const strona = await prisma.strona.findUnique({ where: { id } });
  if (!strona) return Response.json({ error: "Nie znaleziono" }, { status: 404 });
  return Response.json(strona);
}

export async function PATCH(request, { params }) {
  if (!(await hasAccess("strony"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const data = {};
  if (body.tytul !== undefined) data.tytul = body.tytul.trim();
  if (body.slug !== undefined) data.slug = body.slug.trim();
  if (body.tresc !== undefined) data.tresc = body.tresc;
  if (body.metaOpis !== undefined) data.metaOpis = body.metaOpis?.trim() || null;
  if (body.published !== undefined) data.published = body.published;
  const strona = await prisma.strona.update({ where: { id }, data });
  return Response.json(strona);
}

export async function DELETE(request, { params }) {
  if (!(await hasAccess("strony"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  await prisma.strona.delete({ where: { id } });
  return Response.json({ ok: true });
}

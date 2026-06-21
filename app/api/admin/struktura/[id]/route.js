import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  if (!(await hasAccess("struktura"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const data = {};
  if (body.rola !== undefined) data.rola = body.rola.trim();
  if (body.imie !== undefined) data.imie = body.imie.trim();
  if (body.telefon !== undefined) data.telefon = body.telefon?.trim() || null;
  if (body.email !== undefined) data.email = body.email?.trim() || null;
  if (body.kolejnosc !== undefined) data.kolejnosc = Number(body.kolejnosc) || 0;
  if (body.aktywny !== undefined) data.aktywny = body.aktywny;
  const osoba = await prisma.zarzadOsoba.update({ where: { id }, data });
  return Response.json(osoba);
}

export async function DELETE(request, { params }) {
  if (!(await hasAccess("struktura"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  await prisma.zarzadOsoba.delete({ where: { id } });
  return Response.json({ ok: true });
}

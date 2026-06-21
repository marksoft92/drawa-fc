import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  if (!(await hasAccess("sklep"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const data = {};
  if (body.nazwa !== undefined) data.nazwa = body.nazwa.trim();
  if (body.slug !== undefined) data.slug = body.slug.trim();
  if (body.kolejnosc !== undefined) data.kolejnosc = Number(body.kolejnosc) || 0;

  const kat = await prisma.kategoriaProduktu.update({ where: { id }, data });
  return Response.json(kat);
}

export async function DELETE(request, { params }) {
  if (!(await hasAccess("sklep"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const count = await prisma.produkt.count({ where: { kategoriaId: id } });
  if (count > 0) return Response.json({ error: `Kategoria ma ${count} produktów — najpierw je przenieś` }, { status: 409 });

  await prisma.kategoriaProduktu.delete({ where: { id } });
  return Response.json({ ok: true });
}

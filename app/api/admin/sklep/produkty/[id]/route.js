import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  if (!(await hasAccess("sklep"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const produkt = await prisma.produkt.findUnique({
    where: { id },
    include: { kategoria: { select: { id: true, nazwa: true } } },
  });
  if (!produkt) return Response.json({ error: "Nie znaleziono" }, { status: 404 });
  return Response.json(produkt);
}

export async function PATCH(request, { params }) {
  if (!(await hasAccess("sklep"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const data = {};
  if (body.nazwa !== undefined) data.nazwa = body.nazwa.trim();
  if (body.slug !== undefined) data.slug = body.slug.trim();
  if (body.opis !== undefined) data.opis = body.opis.trim();
  if (body.cena !== undefined) data.cena = Number(body.cena);
  if (body.zdjecia !== undefined) data.zdjecia = body.zdjecia;
  if (body.kategoriaId !== undefined) data.kategoriaId = body.kategoriaId || null;
  if (body.warianty !== undefined) data.warianty = body.warianty;
  if (body.stan !== undefined) data.stan = Number(body.stan);
  if (body.published !== undefined) data.published = body.published;
  if (body.kolejnosc !== undefined) data.kolejnosc = Number(body.kolejnosc);

  const produkt = await prisma.produkt.update({ where: { id }, data });
  return Response.json(produkt);
}

export async function DELETE(request, { params }) {
  if (!(await hasAccess("sklep"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const orders = await prisma.zamowieniePozycja.count({ where: { produktId: id } });
  if (orders > 0) return Response.json({ error: "Produkt ma zamówienia — nie można usunąć" }, { status: 409 });
  await prisma.produkt.delete({ where: { id } });
  return Response.json({ ok: true });
}

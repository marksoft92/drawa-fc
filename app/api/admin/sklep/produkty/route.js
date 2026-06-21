import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAccess("sklep"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const produkty = await prisma.produkt.findMany({
    orderBy: [{ kolejnosc: "asc" }, { createdAt: "desc" }],
    include: { kategoria: { select: { id: true, nazwa: true } } },
  });
  return Response.json(produkty);
}

export async function POST(request) {
  if (!(await hasAccess("sklep"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const body = await request.json();
  const { nazwa, slug, opis, cena, zdjecia, kategoriaId, warianty, stan, published, kolejnosc } = body;
  if (!nazwa?.trim() || !slug?.trim()) return Response.json({ error: "Nazwa i slug są wymagane" }, { status: 400 });
  if (cena === undefined || cena < 0) return Response.json({ error: "Podaj cenę" }, { status: 400 });

  const exists = await prisma.produkt.findUnique({ where: { slug: slug.trim() } });
  if (exists) return Response.json({ error: "Produkt z tym slugiem już istnieje" }, { status: 409 });

  const produkt = await prisma.produkt.create({
    data: {
      nazwa: nazwa.trim(),
      slug: slug.trim(),
      opis: opis?.trim() || "",
      cena: Number(cena),
      zdjecia: Array.isArray(zdjecia) ? zdjecia : [],
      kategoriaId: kategoriaId || null,
      warianty: Array.isArray(warianty) ? warianty : [],
      stan: Number(stan) || 0,
      published: published ?? false,
      kolejnosc: Number(kolejnosc) || 0,
    },
  });
  return Response.json(produkt, { status: 201 });
}

import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAccess("sklep"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const kategorie = await prisma.kategoriaProduktu.findMany({
    orderBy: [{ kolejnosc: "asc" }, { nazwa: "asc" }],
    include: { _count: { select: { produkty: true } } },
  });
  return Response.json(kategorie);
}

export async function POST(request) {
  if (!(await hasAccess("sklep"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { nazwa, slug, kolejnosc } = await request.json();
  if (!nazwa?.trim()) return Response.json({ error: "Nazwa jest wymagana" }, { status: 400 });

  const s = slug?.trim() || slugify(nazwa);
  const exists = await prisma.kategoriaProduktu.findUnique({ where: { slug: s } });
  if (exists) return Response.json({ error: "Kategoria z tym slugiem już istnieje" }, { status: 409 });

  const kat = await prisma.kategoriaProduktu.create({
    data: { nazwa: nazwa.trim(), slug: s, kolejnosc: Number(kolejnosc) || 0 },
  });
  return Response.json(kat, { status: 201 });
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/ą/g, "a").replace(/ć/g, "c").replace(/ę/g, "e").replace(/ł/g, "l")
    .replace(/ń/g, "n").replace(/ó/g, "o").replace(/ś/g, "s").replace(/ź/g, "z").replace(/ż/g, "z")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

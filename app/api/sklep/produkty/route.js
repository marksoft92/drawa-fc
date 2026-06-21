import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const produkty = await prisma.produkt.findMany({
    where: { published: true },
    orderBy: [{ kolejnosc: "asc" }, { createdAt: "desc" }],
    include: { kategoria: { select: { id: true, nazwa: true, slug: true } } },
  });
  const kategorie = await prisma.kategoriaProduktu.findMany({
    orderBy: [{ kolejnosc: "asc" }, { nazwa: "asc" }],
    where: { produkty: { some: { published: true } } },
  });
  return Response.json({ produkty, kategorie });
}

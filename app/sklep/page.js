import { prisma } from "@/lib/prisma";
import SklepClient from "./SklepClient";

export const revalidate = 60;

export default async function SklepPage() {
  const [produkty, kategorie] = await Promise.all([
    prisma.produkt.findMany({
      where: { published: true },
      orderBy: [{ kolejnosc: "asc" }, { createdAt: "desc" }],
      include: { kategoria: { select: { id: true, nazwa: true, slug: true } } },
    }),
    prisma.kategoriaProduktu.findMany({
      orderBy: [{ kolejnosc: "asc" }, { nazwa: "asc" }],
      where: { produkty: { some: { published: true } } },
    }),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" },
          { "@type": "ListItem", position: 2, name: "Sklep" },
        ],
      }) }} />
      <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", borderWidth: 0 }}>
        Sklep MKS Drawa Drawno
      </h1>
      <SklepClient
        produkty={JSON.parse(JSON.stringify(produkty))}
        kategorie={JSON.parse(JSON.stringify(kategorie))}
      />
    </>
  );
}

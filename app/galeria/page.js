import { prisma } from "@/lib/prisma";
import GaleriaClient from "./GaleriaClient";

export const revalidate = 60;

export default async function GaleriaPage() {
  const albumy = await prisma.album.findMany({
    where: { published: true },
    orderBy: [{ kolejnosc: "asc" }, { date: "desc" }],
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" }, { "@type": "ListItem", position: 2, name: "Galeria" }] }) }} />
      <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", borderWidth: 0 }}>
        Galeria zdjęć MKS Drawa Drawno
      </h1>
      <GaleriaClient albumy={JSON.parse(JSON.stringify(albumy))} />
    </>
  );
}

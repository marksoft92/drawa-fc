import { prisma } from "@/lib/prisma";
import AktualnosciClient from "./AktualnosciClient";

export const revalidate = 60;

export default async function AktualnosciPage() {
  const artykuly = await prisma.artykul.findMany({
    where: { published: true },
    orderBy: { date: "desc" },
    select: {
      id: true, slug: true, title: true, excerpt: true,
      thumbnail: true, kolor: true, tags: true, date: true, pinned: true,
    },
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" }, { "@type": "ListItem", position: 2, name: "Aktualności" }] }) }} />
      <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", borderWidth: 0 }}>
        Aktualności MKS Drawa Drawno
      </h1>
      <AktualnosciClient artykuly={JSON.parse(JSON.stringify(artykuly))} />
    </>
  );
}

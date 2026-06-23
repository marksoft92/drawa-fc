import { prisma } from "@/lib/prisma";
import PilkaLokalnaClient from "./PilkaLokalnaClient";

export const revalidate = 120;

export const metadata = {
  title: "Piłka lokalna — aktualności z ligi | MKS Drawa Drawno",
  description: "Najnowsze wiadomości z klubów lokalnej ligi piłkarskiej. Transfery, wyniki, zapowiedzi meczów z regionu.",
  alternates: { canonical: "https://mksdrawadrawno.pl/pilka-lokalna" },
  openGraph: {
    title: "Piłka lokalna — aktualności z ligi | MKS Drawa Drawno",
    description: "Najnowsze wiadomości z klubów lokalnej ligi piłkarskiej.",
    url: "https://mksdrawadrawno.pl/pilka-lokalna",
  },
};

export default async function PilkaLokalnaPage() {
  const wpisy = await prisma.wpisLigowy.findMany({
    where: { published: true },
    include: { zrodlo: { select: { nazwa: true, herb: true } } },
    orderBy: [{ dataPostu: "desc" }, { createdAt: "desc" }],
  });

  const zrodlaMap = new Map();
  for (const w of wpisy) {
    if (w.zrodlo && w.zrodloId && !zrodlaMap.has(w.zrodloId)) {
      zrodlaMap.set(w.zrodloId, { id: w.zrodloId, nazwa: w.zrodlo.nazwa, herb: w.zrodlo.herb });
    }
  }
  const zrodla = [...zrodlaMap.values()].sort((a, b) => a.nazwa.localeCompare(b.nazwa, "pl"));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" },
          { "@type": "ListItem", position: 2, name: "Piłka lokalna" },
        ],
      }) }} />
      <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", borderWidth: 0 }}>
        Piłka lokalna — aktualności z ligi
      </h1>
      <PilkaLokalnaClient wpisy={JSON.parse(JSON.stringify(wpisy))} zrodla={zrodla} />
    </>
  );
}

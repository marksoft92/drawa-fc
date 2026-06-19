import { prisma } from "@/lib/prisma";
import { getAllOpponents, computeStats } from "@/lib/rywale";
import ArchiwumClient from "./ArchiwumClient";

export const revalidate = 300;

export default async function ArchiwumPage() {
  const [sezonyDb, ustawienia, archiwumDb, opponentsMap] = await Promise.all([
    prisma.sezon.findMany({ orderBy: { nazwa: "desc" }, select: { id: true, nazwa: true, aktywny: true } }),
    prisma.ustawienie.findMany(),
    prisma.archiwumSezon.findMany({
      orderBy: { sezon: "desc" },
      select: { id: true, sourceId: true, sezon: true, liga: true, _count: { select: { mecze: true, tabela: true } } },
    }),
    getAllOpponents(),
  ]);

  const ust = Object.fromEntries(ustawienia.map(r => [r.klucz, r.wartosc]));

  const rywale = [...opponentsMap.values()].map(e => {
    const s = computeStats(e.mecze);
    const hasPuchar = e.mecze.some(m => m.puchar);
    const hasLiga = e.mecze.some(m => !m.puchar);
    return { nazwa: e.nazwa, slug: e.slug, herb: e.herb, mecze: s.mecze, wygrane: s.wygrane, remisy: s.remisy, przegrane: s.przegrane, bramkiZdobyte: s.bramkiZdobyte, bramkiStracone: s.bramkiStracone, sezony: e.sezony.size, hasPuchar, hasLiga };
  }).sort((a, b) => b.mecze - a.mecze);

  const initialData = {
    sezony: JSON.parse(JSON.stringify(sezonyDb)),
    aktywnySezon: ust.aktywny_sezon || null,
    archiwum: JSON.parse(JSON.stringify(archiwumDb)),
    rywale,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" }, { "@type": "ListItem", position: 2, name: "Archiwum" }] }) }} />
      <ArchiwumClient initialData={initialData} />
    </>
  );
}

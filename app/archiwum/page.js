import { prisma } from "@/lib/prisma";
import { getAllOpponents, computeStats } from "@/lib/rywale";
import ArchiwumClient from "./ArchiwumClient";

export const revalidate = 300;

export default async function ArchiwumPage() {
  const [sezonyDb, ustawienia, archiwumDb, opponentsMap] = await Promise.all([
    prisma.sezon.findMany({ orderBy: { nazwa: "desc" } }),
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
      <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", borderWidth: 0 }}>
        Archiwum wyników MKS Drawa Drawno
      </h1>
      <ArchiwumClient initialData={initialData} />
    </>
  );
}

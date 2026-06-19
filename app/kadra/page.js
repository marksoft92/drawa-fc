import { prisma } from "@/lib/prisma";
import KadraClient from "./KadraClient";

export const revalidate = 60;

async function getKadraData() {
  const sezon = await prisma.sezon.findFirst({ where: { aktywny: true } });
  const players = await prisma.player.findMany({
    where: { user: { active: true } },
    include: { stats: sezon ? { where: { sezonId: sezon.id } } : false },
    orderBy: { imieNazwisko: "asc" },
  });
  const mapped = players.map((p) => {
    const s = p.stats?.[0];
    return {
      id: p.id, imieNazwisko: p.imieNazwisko, pozycja: p.pozycja, numer: p.numer,
      foto: p.foto, pseudonim: p.pseudonim,
      mecze: s?.mecze ?? 0, gole: s?.gole ?? 0, asysty: s?.asysty ?? 0,
      zolte: s?.zolte ?? 0, czerwone: s?.czerwone ?? 0,
      meczePuchar: s?.meczePuchar ?? 0, golePuchar: s?.golePuchar ?? 0,
    };
  });
  mapped.sort((a, b) => b.gole - a.gole || b.asysty - a.asysty || b.mecze - a.mecze || a.imieNazwisko.localeCompare(b.imieNazwisko, "pl"));
  return { sezon: sezon?.nazwa ?? null, players: mapped };
}

export default async function KadraPage() {
  const kadraData = await getKadraData();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Strona główna", item: "https://mksdrawadrawno.pl" }, { "@type": "ListItem", position: 2, name: "Kadra" }] }) }} />
      <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", borderWidth: 0 }}>
        Kadra MKS Drawa Drawno
      </h1>
      <KadraClient kadraData={JSON.parse(JSON.stringify(kadraData))} />
    </>
  );
}

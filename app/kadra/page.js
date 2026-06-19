import NavBar from "@/components/NavBar";
import Kadra from "@/components/kadra";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

const SectionLabel = ({ children }) => (
  <h2 style={{ display: "flex", alignItems: "center", gap: 12, margin: 0 }}>
    <div style={{ width: 4, height: 24, background: "#3b82f6", borderRadius: 2, boxShadow: "0 0 12px rgba(59,130,246,0.65)" }} />
    <span style={{ fontSize: "clamp(20px, 4vw, 28px)", fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.1em", color: "#fff", fontWeight: "normal" }}>{children}</span>
  </h2>
);

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
      <NavBar backLabel="Strona główna" />
      <div style={{ paddingTop: 64 }}>
        <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", borderWidth: 0 }}>
          Kadra MKS Drawa Drawno
        </h1>
        <Kadra SectionLabel={SectionLabel} kadraData={JSON.parse(JSON.stringify(kadraData))} />
      </div>
    </>
  );
}

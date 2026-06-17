import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CACHE = "public, s-maxage=30, stale-while-revalidate=120";

export async function GET() {
  const [ustawienia, aktualnosci, galeria, sponsorzy, struktura, kadraData, archiwumStats] = await Promise.all([
    prisma.ustawienie.findMany(),
    prisma.artykul.findMany({
      where: { published: true },
      orderBy: { date: "desc" },
      select: { id: true, slug: true, title: true, excerpt: true, thumbnail: true, kolor: true, tags: true, date: true, pinned: true },
    }),
    prisma.album.findMany({
      where: { published: true },
      orderBy: [{ kolejnosc: "asc" }, { date: "desc" }],
    }),
    prisma.sponsor.findMany({
      where: { aktywny: true },
      orderBy: [{ kolejnosc: "asc" }, { createdAt: "asc" }],
      select: { id: true, nazwa: true, logo: true, href: true },
    }),
    prisma.zarzadOsoba.findMany({
      where: { aktywny: true },
      orderBy: [{ kolejnosc: "asc" }, { createdAt: "asc" }],
      select: { id: true, rola: true, imie: true, telefon: true, email: true },
    }),
    (async () => {
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
    })(),
    (async () => {
      const sezony = await prisma.archiwumSezon.findMany({
        where: { NOT: { liga: { contains: "Puchar" } } },
        select: { sezon: true, mecze: { select: { score: true, team1: true, team2: true } } },
      });
      const uniqueSezony = new Set(sezony.map((s) => s.sezon).filter(Boolean));
      let mecze = 0, gole = 0, wygrane = 0;
      for (const s of sezony) {
        for (const m of s.mecze) {
          if (!m.score) continue;
          mecze++;
          const [g1, g2] = m.score.split(":").map(Number);
          if (isNaN(g1) || isNaN(g2)) continue;
          const dHome = m.team1?.toLowerCase().includes("drawa drawno");
          gole += dHome ? g1 : g2;
          if ((dHome ? g1 : g2) > (dHome ? g2 : g1)) wygrane++;
        }
      }
      return { sezony: uniqueSezony.size, mecze, gole, wygrane };
    })(),
  ]);

  const ust = Object.fromEntries(ustawienia.map((r) => [r.klucz, r.wartosc]));
  const sezonNazwa = ust.aktywny_sezon || "2025/26";
  const enc = sezonNazwa;

  const [tabela, mecze] = await Promise.all([
    prisma.tabelaDruzyna.findMany({ where: { sezon: enc }, orderBy: { pozycja: "asc" } }),
    prisma.mecz.findMany({ where: { sezon: enc }, orderBy: { date: "asc" } }),
  ]);

  return Response.json(
    { ustawienia: ust, aktualnosci, galeria, sponsorzy, struktura, kadra: kadraData, tabela, mecze, allTimeStats: archiwumStats },
    { headers: { "Cache-Control": CACHE } }
  );
}

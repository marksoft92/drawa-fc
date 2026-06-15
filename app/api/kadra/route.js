import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const sezon = await prisma.sezon.findFirst({ where: { aktywny: true } });

  const players = await prisma.player.findMany({
    where: { user: { active: true } },
    include: {
      stats: sezon ? { where: { sezonId: sezon.id } } : false,
    },
    orderBy: { imieNazwisko: "asc" },
  });

  return Response.json({
    sezon: sezon?.nazwa ?? null,
    players: players.map((p) => {
      const s = p.stats?.[0];
      return {
        id: p.id,
        imieNazwisko: p.imieNazwisko,
        pozycja: p.pozycja,
        numer: p.numer,
        foto: p.foto,
        pseudonim: p.pseudonim,
        mecze: s?.mecze ?? 0,
        gole: s?.gole ?? 0,
        asysty: s?.asysty ?? 0,
        zolte: s?.zolte ?? 0,
        czerwone: s?.czerwone ?? 0,
        meczePuchar: s?.meczePuchar ?? 0,
        golePuchar: s?.golePuchar ?? 0,
      };
    }),
  });
}

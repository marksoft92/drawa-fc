import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const sezony = await prisma.archiwumSezon.findMany({
    where: { NOT: { liga: { contains: "Puchar" } } },
    select: { sezon: true, mecze: { select: { score: true, team1: true, team2: true } } },
  });

  const uniqueSezony = new Set(sezony.map((s) => s.sezon).filter(Boolean));
  let totalMecze = 0, totalGole = 0, totalWygrane = 0, totalRemisy = 0;

  for (const s of sezony) {
    for (const m of s.mecze) {
      if (!m.score) continue;
      totalMecze++;
      const [g1, g2] = m.score.split(":").map(Number);
      if (isNaN(g1) || isNaN(g2)) continue;
      const dHome = m.team1?.toLowerCase().includes("drawa drawno");
      const dGoals = dHome ? g1 : g2;
      const oGoals = dHome ? g2 : g1;
      totalGole += dGoals;
      if (dGoals > oGoals) totalWygrane++;
      else if (dGoals === oGoals) totalRemisy++;
    }
  }

  return Response.json(
    { sezony: uniqueSezony.size, mecze: totalMecze, gole: totalGole, wygrane: totalWygrane, remisy: totalRemisy, przegrane: totalMecze - totalWygrane - totalRemisy },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const [tabele, mecze] = await Promise.all([
    prisma.tabelaDruzyna.findMany({ select: { sezon: true }, distinct: ["sezon"] }),
    prisma.mecz.findMany({ select: { sezon: true }, distinct: ["sezon"] }),
  ]);
  const set = new Set([...tabele.map(r => r.sezon), ...mecze.map(r => r.sezon)]);
  return Response.json([...set].sort().reverse(), { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}

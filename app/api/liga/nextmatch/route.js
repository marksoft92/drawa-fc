import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await prisma.ustawienie.findUnique({ where: { klucz: "aktywny_sezon" } });
  const sezon = u?.wartosc || "2025/26";
  const mecz = await prisma.mecz.findFirst({
    where: { sezon, score: null, walkower: false },
    orderBy: { date: "asc" },
  });
  if (!mecz) return Response.json(null, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  return Response.json(mecz, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}

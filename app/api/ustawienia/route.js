import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.ustawienie.findMany();
  const obj = Object.fromEntries(rows.map(r => [r.klucz, r.wartosc]));
  return Response.json(obj, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}

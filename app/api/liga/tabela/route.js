import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const sezon = new URL(request.url).searchParams.get("sezon") || "2025/26";
  const tabela = await prisma.tabelaDruzyna.findMany({
    where: { sezon },
    orderBy: { pozycja: "asc" },
  });
  return Response.json(tabela, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}

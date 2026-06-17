import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const albumy = await prisma.album.findMany({
    where: { published: true },
    orderBy: [{ kolejnosc: "asc" }, { date: "desc" }],
  });
  return Response.json(albumy, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}

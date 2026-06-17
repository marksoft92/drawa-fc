import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const artykuly = await prisma.artykul.findMany({
    where: { published: true },
    orderBy: { date: "desc" },
    select: {
      id: true, slug: true, title: true, excerpt: true,
      thumbnail: true, kolor: true, tags: true, date: true, pinned: true,
    },
  });
  return Response.json(artykuly, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}

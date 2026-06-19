import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const wideo = await prisma.wideo.findMany({
    where: { published: true },
    orderBy: [{ kolejnosc: "asc" }, { createdAt: "desc" }],
  });
  return Response.json(wideo, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}

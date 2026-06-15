import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const albumy = await prisma.album.findMany({
    where: { published: true },
    orderBy: [{ kolejnosc: "asc" }, { date: "desc" }],
  });
  return Response.json(albumy);
}

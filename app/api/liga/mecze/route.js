import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const sezon = new URL(request.url).searchParams.get("sezon") || "2025/26";
  const mecze = await prisma.mecz.findMany({
    where: { sezon },
    orderBy: { createdAt: "asc" },
  });
  return Response.json(mecze);
}

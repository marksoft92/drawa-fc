import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const sponsorzy = await prisma.sponsor.findMany({
    where: { aktywny: true },
    orderBy: [{ kolejnosc: "asc" }, { createdAt: "asc" }],
    select: { id: true, nazwa: true, logo: true, href: true },
  });
  return Response.json(sponsorzy, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}

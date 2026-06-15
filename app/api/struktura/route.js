import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const osoby = await prisma.zarzadOsoba.findMany({
    where: { aktywny: true },
    orderBy: [{ kolejnosc: "asc" }, { createdAt: "asc" }],
    select: { id: true, rola: true, imie: true, telefon: true, email: true },
  });
  return Response.json(osoby);
}

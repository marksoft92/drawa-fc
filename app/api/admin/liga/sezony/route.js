import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const [tabele, mecze] = await Promise.all([
    prisma.tabelaDruzyna.findMany({ select: { sezon: true }, distinct: ["sezon"] }),
    prisma.mecz.findMany({ select: { sezon: true }, distinct: ["sezon"] }),
  ]);
  const set = new Set([...tabele.map(r => r.sezon), ...mecze.map(r => r.sezon)]);
  const sezony = [...set].sort().reverse();
  return Response.json(sezony);
}

import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const [tabele, mecze, modelSezony] = await Promise.all([
    prisma.tabelaDruzyna.findMany({ select: { sezon: true }, distinct: ["sezon"] }),
    prisma.mecz.findMany({ select: { sezon: true }, distinct: ["sezon"] }),
    prisma.sezon.findMany({ select: { nazwa: true } }),
  ]);
  const set = new Set([
    ...tabele.map(r => r.sezon),
    ...mecze.map(r => r.sezon),
    ...modelSezony.map(r => r.nazwa),
  ]);
  const sezony = [...set].sort().reverse();
  return Response.json(sezony);
}

export async function POST(request) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { sezon } = await request.json();
  if (!sezon?.trim()) return Response.json({ error: "Brak nazwy" }, { status: 400 });

  const nazwa = sezon.trim();
  await prisma.sezon.updateMany({ data: { aktywny: false } });
  await prisma.sezon.upsert({
    where: { nazwa },
    update: { aktywny: true },
    create: { nazwa, aktywny: true },
  });

  return Response.json({ ok: true });
}

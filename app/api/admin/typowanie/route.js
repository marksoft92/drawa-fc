import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 403 });

  const lista = await prisma.typowanie.findMany({
    orderBy: { dataRozpoczecia: "desc" },
    include: { _count: { select: { wpisy: true } } },
  });

  return Response.json(lista);
}

export async function POST(req) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 403 });

  const body = await req.json();
  const { team1, team2, herb1, herb2, dataRozpoczecia } = body;

  if (!team1?.trim() || !team2?.trim() || !dataRozpoczecia) {
    return Response.json({ error: "Podaj obie drużyny i datę meczu" }, { status: 400 });
  }

  const data = new Date(dataRozpoczecia);
  if (isNaN(data.getTime())) {
    return Response.json({ error: "Nieprawidłowa data" }, { status: 400 });
  }

  const typowanie = await prisma.typowanie.create({
    data: {
      team1: team1.trim(),
      team2: team2.trim(),
      herb1: herb1?.trim() || null,
      herb2: herb2?.trim() || null,
      dataRozpoczecia: data,
    },
  });

  return Response.json(typowanie, { status: 201 });
}

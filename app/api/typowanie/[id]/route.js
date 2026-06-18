import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const { id } = await params;

  const typowanie = await prisma.typowanie.findUnique({
    where: { id },
    include: {
      wpisy: { orderBy: [{ punkty: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }] },
      _count: { select: { wpisy: true } },
    },
  });

  if (!typowanie) return Response.json({ error: "Nie znaleziono" }, { status: 404 });

  if (typowanie.wynikTeam1 === null) {
    const { wpisy, ...rest } = typowanie;
    return Response.json(rest);
  }

  return Response.json(typowanie);
}

export async function POST(req, { params }) {
  const { id } = await params;
  const body = await req.json();

  const { imie, nazwisko, golTeam1, golTeam2 } = body;

  if (!imie?.trim() || !nazwisko?.trim()) {
    return Response.json({ error: "Podaj imię i nazwisko" }, { status: 400 });
  }
  if (imie.trim().length > 50 || nazwisko.trim().length > 50) {
    return Response.json({ error: "Imię/nazwisko max 50 znaków" }, { status: 400 });
  }

  const g1 = Number(golTeam1);
  const g2 = Number(golTeam2);
  if (!Number.isInteger(g1) || !Number.isInteger(g2) || g1 < 0 || g1 > 20 || g2 < 0 || g2 > 20) {
    return Response.json({ error: "Wynik musi być liczbą 0-20" }, { status: 400 });
  }

  const typowanie = await prisma.typowanie.findUnique({ where: { id } });
  if (!typowanie) return Response.json({ error: "Nie znaleziono typowania" }, { status: 404 });
  if (!typowanie.aktywne) return Response.json({ error: "Typowanie jest zamknięte" }, { status: 400 });
  if (new Date() >= typowanie.dataRozpoczecia) {
    return Response.json({ error: "Typowanie zostało zamknięte — mecz się już rozpoczął" }, { status: 400 });
  }

  try {
    const wpis = await prisma.typowanieWpis.create({
      data: {
        typowanieId: id,
        imie: imie.trim(),
        nazwisko: nazwisko.trim(),
        golTeam1: g1,
        golTeam2: g2,
      },
    });
    return Response.json(wpis, { status: 201 });
  } catch (e) {
    if (e?.code === "P2002") {
      return Response.json({ error: "Już oddałeś typ na ten mecz" }, { status: 409 });
    }
    throw e;
  }
}

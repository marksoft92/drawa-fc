import { getPlayerSession, isAdminOrStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { id } = await params;
  const ankieta = await prisma.ankieta.findUnique({
    where: { id },
    include: {
      opcje: { orderBy: { kolejnosc: "asc" } },
      glosy: {
        include: {
          user: { select: { login: true, player: { select: { imieNazwisko: true } } } },
          opcja: { select: { tresc: true } },
        },
      },
      creator: { select: { login: true, player: { select: { imieNazwisko: true } } } },
    },
  });

  if (!ankieta) return Response.json({ error: "Nie znaleziono" }, { status: 404 });

  const now = new Date();
  const aktywna = ankieta.aktywna && (!ankieta.deadline || ankieta.deadline > now);
  const userId = session.user.id;
  const mojGlos = ankieta.glosy.find((g) => g.userId === userId)?.opcjaId ?? null;

  return Response.json({
    id: ankieta.id,
    tytul: ankieta.tytul,
    pytanie: ankieta.pytanie,
    deadline: ankieta.deadline,
    aktywna,
    createdAt: ankieta.createdAt,
    creatorName: ankieta.creator.player?.imieNazwisko ?? ankieta.creator.login,
    mojGlos,
    totalGlosy: ankieta.glosy.length,
    opcje: ankieta.opcje.map((o) => ({
      id: o.id,
      tresc: o.tresc,
      liczbaGlosow: ankieta.glosy.filter((g) => g.opcjaId === o.id).length,
    })),
    glosujacy: ankieta.glosy.map((g) => ({
      userId: g.userId,
      name: g.user.player?.imieNazwisko ?? g.user.login,
      opcjaId: g.opcjaId,
      opcjaTresc: g.opcja.tresc,
      createdAt: g.createdAt,
    })),
  });
}

export async function DELETE(request, { params }) {
  if (!(await isAdminOrStaff())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { id } = await params;
  await prisma.ankieta.delete({ where: { id } });
  return Response.json({ ok: true });
}

export async function PATCH(request, { params }) {
  if (!(await isAdminOrStaff())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { id } = await params;
  const { aktywna } = await request.json();

  const updated = await prisma.ankieta.update({
    where: { id },
    data: { aktywna: Boolean(aktywna) },
  });

  return Response.json(updated);
}

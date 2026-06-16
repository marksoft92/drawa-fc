import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request, { params }) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { id: ankietaId } = await params;
  const { opcjaId } = await request.json();

  if (!opcjaId) return Response.json({ error: "Wybierz opcję" }, { status: 400 });

  const ankieta = await prisma.ankieta.findUnique({
    where: { id: ankietaId },
    select: { aktywna: true, deadline: true },
  });

  if (!ankieta) return Response.json({ error: "Nie znaleziono ankiety" }, { status: 404 });

  const now = new Date();
  if (!ankieta.aktywna || (ankieta.deadline && ankieta.deadline <= now)) {
    return Response.json({ error: "Ankieta jest zakończona" }, { status: 400 });
  }

  const opcja = await prisma.ankietaOpcja.findFirst({
    where: { id: opcjaId, ankietaId },
  });
  if (!opcja) return Response.json({ error: "Nieprawidłowa opcja" }, { status: 400 });

  const existing = await prisma.ankietaGlos.findUnique({
    where: { ankietaId_userId: { ankietaId, userId: session.user.id } },
  });
  if (existing) return Response.json({ error: "Już zagłosowałeś" }, { status: 409 });

  const glos = await prisma.ankietaGlos.create({
    data: {
      ankietaId,
      opcjaId,
      userId: session.user.id,
    },
  });

  return Response.json(glos, { status: 201 });
}

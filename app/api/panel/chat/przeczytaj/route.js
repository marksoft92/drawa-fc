import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatEmitter } from "@/lib/chatEmitter";

export async function POST(request) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ ok: false }, { status: 401 });

  const { wiadId } = await request.json();
  if (!wiadId) return Response.json({ ok: false }, { status: 400 });

  await prisma.chatOdczytanie.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ostatniaId: wiadId },
    update: { ostatniaId: wiadId },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, login: true, player: { select: { imieNazwisko: true, foto: true } } },
  });

  const name = user.player?.imieNazwisko ?? user.login;

  chatEmitter.emit("event", {
    type: "odczytanie",
    userId: session.user.id,
    name,
    initials: name.charAt(0).toUpperCase(),
    foto: user.player?.foto ?? null,
    ostatniaId: wiadId,
  });

  return Response.json({ ok: true });
}

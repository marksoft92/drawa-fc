import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dmEmitter } from "@/lib/dmEmitter";
import { randomBytes } from "crypto";

function convKey(a, b) { return [a, b].sort().join(":"); }

export async function POST(request, { params }) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const myId = session.user.id;
  const { userId } = await params;
  const { msgId, emoji } = await request.json();

  const channel = convKey(myId, userId);
  const [sortU1, sortU2] = [myId, userId].sort();
  const conv = await prisma.privateConversation.findUnique({
    where: { user1Id_user2Id: { user1Id: sortU1, user2Id: sortU2 } },
  });
  if (!conv) return Response.json({ error: "Brak konwersacji" }, { status: 404 });

  const existing = await prisma.privateReakcja.findUnique({
    where: { wiadId_userId_emoji: { wiadId: msgId, userId: myId, emoji } },
  });

  if (existing) {
    await prisma.privateReakcja.delete({ where: { id: existing.id } });
  } else {
    await prisma.privateReakcja.create({
      data: { id: randomBytes(6).toString("hex"), wiadId: msgId, userId: myId, emoji },
    });
  }

  const msg = await prisma.privateWiadomosc.findUnique({
    where: { id: msgId },
    include: {
      author: { select: { id: true, login: true, player: { select: { imieNazwisko: true, foto: true } } } },
      reakcje: true,
      replyTo: { include: { author: { select: { login: true, player: { select: { imieNazwisko: true } } } } } },
    },
  });
  if (!msg) return Response.json({ error: "Brak wiadomości" }, { status: 404 });

  const reakcje = msg.reakcje.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, mine: false };
    acc[r.emoji].count++;
    if (r.userId === myId) acc[r.emoji].mine = true;
    return acc;
  }, {});

  dmEmitter.emit(channel, { type: "reakcja", data: { msgId, reakcje } });
  return Response.json({ ok: true });
}

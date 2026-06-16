import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dmEmitter } from "@/lib/dmEmitter";

function convKey(a, b) { return [a, b].sort(); }

export async function DELETE(request, { params }) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const myId = session.user.id;
  const { userId, msgId } = await params;

  const msg = await prisma.privateWiadomosc.findUnique({ where: { id: msgId } });
  if (!msg || msg.authorId !== myId) return Response.json({ error: "Brak dostępu" }, { status: 403 });

  await prisma.privateWiadomosc.update({
    where: { id: msgId },
    data: { usunieta: true, tresc: null, plik: null },
  });

  const [u1, u2] = convKey(myId, userId);
  const conv = await prisma.privateConversation.findUnique({
    where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
  });
  if (conv) {
    const channel = [myId, userId].sort().join(":");
    dmEmitter.emit(channel, { type: "delete", data: { msgId } });
  }

  return Response.json({ ok: true });
}

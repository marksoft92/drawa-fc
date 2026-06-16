import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatEmitter } from "@/lib/chatEmitter";

function convKey(a, b) { return [a, b].sort().join(":"); }

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

  const eventName = "dm:" + convKey(myId, userId);
  chatEmitter.emit(eventName, { type: "delete", data: { msgId } });

  return Response.json({ ok: true });
}

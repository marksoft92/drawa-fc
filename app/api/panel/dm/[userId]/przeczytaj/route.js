import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dmEmitter } from "@/lib/dmEmitter";

function convKey(a, b) { return [a, b].sort(); }

export async function POST(request, { params }) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ ok: false }, { status: 401 });
  const myId = session.user.id;
  const { userId } = await params;
  const { msgId } = await request.json();

  const [u1, u2] = convKey(myId, userId);
  const conv = await prisma.privateConversation.findUnique({
    where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
  });
  if (!conv) return Response.json({ ok: true });

  await prisma.privateOdczytanie.upsert({
    where: { convId_userId: { convId: conv.id, userId: myId } },
    create: { convId: conv.id, userId: myId, ostatniaId: msgId },
    update: { ostatniaId: msgId },
  });

  const me = await prisma.user.findUnique({
    where: { id: myId },
    select: { id: true, login: true, player: { select: { imieNazwisko: true, foto: true } } },
  });
  const name = me?.player?.imieNazwisko ?? me?.login ?? "?";

  dmEmitter.emit("event", {
    convId: conv.id,
    type: "odczytanie",
    data: {
      userId: myId,
      name,
      foto: me?.player?.foto ?? null,
      initials: name.charAt(0).toUpperCase(),
      ostatniaId: msgId,
    },
  });

  return Response.json({ ok: true });
}

import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const myId = session.user.id;

  const convs = await prisma.privateConversation.findMany({
    where: { OR: [{ user1Id: myId }, { user2Id: myId }] },
    include: {
      user1: { select: { id: true, login: true, lastSeen: true, player: { select: { imieNazwisko: true, foto: true } } } },
      user2: { select: { id: true, login: true, lastSeen: true, player: { select: { imieNazwisko: true, foto: true } } } },
      wiadomosci: {
        where: { usunieta: false },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, tresc: true, typ: true, authorId: true, createdAt: true },
      },
      odczytania: { where: { userId: myId }, select: { ostatniaId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = convs.map((c) => {
    const other = c.user1Id === myId ? c.user2 : c.user1;
    const lastMsg = c.wiadomosci[0] ?? null;
    const read = c.odczytania[0];
    const unread = lastMsg && lastMsg.authorId !== myId && read?.ostatniaId !== lastMsg.id ? 1 : 0;
    const name = other.player?.imieNazwisko ?? other.login;
    const online = other.lastSeen && (Date.now() - new Date(other.lastSeen)) / 60000 < 5;

    return {
      convId: c.id,
      otherId: other.id,
      otherName: name,
      otherFoto: other.player?.foto ?? null,
      otherInitials: name.charAt(0).toUpperCase(),
      online,
      lastMsg,
      unread,
    };
  }).sort((a, b) => {
    const ta = a.lastMsg?.createdAt ? new Date(a.lastMsg.createdAt) : new Date(0);
    const tb = b.lastMsg?.createdAt ? new Date(b.lastMsg.createdAt) : new Date(0);
    return tb - ta;
  });

  return Response.json(result);
}

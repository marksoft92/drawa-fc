import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getPlayerSession();
  if (!session) return Response.json({ chat: 0, ankiety: 0 });

  const userId = session.user.id;
  const now = new Date();

  // nieodczytane wiadomości czatu (nie moje)
  let chat = 0;
  const odczytanie = await prisma.chatOdczytanie.findUnique({ where: { userId } });
  if (!odczytanie?.ostatniaId) {
    chat = await prisma.chatWiadomosc.count({ where: { authorId: { not: userId }, usunieta: false } });
  } else {
    const lastRead = await prisma.chatWiadomosc.findUnique({
      where: { id: odczytanie.ostatniaId },
      select: { createdAt: true },
    });
    if (lastRead) {
      chat = await prisma.chatWiadomosc.count({
        where: { createdAt: { gt: lastRead.createdAt }, authorId: { not: userId }, usunieta: false },
      });
    }
  }

  // aktywne ankiety bez głosu
  const aktywne = await prisma.ankieta.findMany({
    where: { aktywna: true, OR: [{ deadline: null }, { deadline: { gt: now } }] },
    select: { id: true },
  });
  let ankiety = 0;
  if (aktywne.length > 0) {
    const ids = aktywne.map((a) => a.id);
    const zaglosowane = await prisma.ankietaGlos.count({ where: { ankietaId: { in: ids }, userId } });
    ankiety = ids.length - zaglosowane;
  }

  // nieodczytane DM (liczba konwersacji z nowymi wiadomościami)
  const myConvs = await prisma.privateConversation.findMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    include: {
      odczytania: { where: { userId }, select: { ostatniaId: true } },
      wiadomosci: {
        where: { authorId: { not: userId }, usunieta: false },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true },
      },
    },
  });
  const dm = myConvs.filter((c) => {
    const lastMsg = c.wiadomosci[0];
    if (!lastMsg) return false;
    const read = c.odczytania[0];
    return !read || read.ostatniaId !== lastMsg.id;
  }).length;

  return Response.json({ chat, ankiety, dm });
}

import { getPlayerSession, isAdminOrStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function GET() {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const now = new Date();
  const ankiety = await prisma.ankieta.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      opcje: { orderBy: { kolejnosc: "asc" } },
      glosy: { select: { userId: true, opcjaId: true } },
      creator: { select: { login: true, player: { select: { imieNazwisko: true } } } },
    },
  });

  const userId = session.user.id;

  return Response.json(
    ankiety.map((a) => {
      const aktywna = a.aktywna && (!a.deadline || a.deadline > now);
      const mojGlos = a.glosy.find((g) => g.userId === userId)?.opcjaId ?? null;
      const totalGlosy = a.glosy.length;

      return {
        id: a.id,
        tytul: a.tytul,
        pytanie: a.pytanie,
        deadline: a.deadline,
        aktywna,
        createdAt: a.createdAt,
        creatorName: a.creator.player?.imieNazwisko ?? a.creator.login,
        mojGlos,
        totalGlosy,
        opcje: a.opcje.map((o) => ({
          id: o.id,
          tresc: o.tresc,
          liczbaGlosow: a.glosy.filter((g) => g.opcjaId === o.id).length,
        })),
        glosujacy: (mojGlos || !aktywna)
          ? a.glosy.map((g) => ({ userId: g.userId, opcjaId: g.opcjaId }))
          : null,
      };
    })
  );
}

export async function POST(request) {
  if (!(await isAdminOrStaff())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const session = await getPlayerSession();
  const { tytul, pytanie, opcje, deadline } = await request.json();

  if (!tytul || !pytanie || !opcje || opcje.length < 2) {
    return Response.json({ error: "Brakuje danych: tytuł, pytanie i min. 2 opcje" }, { status: 400 });
  }

  const ankieta = await prisma.ankieta.create({
    data: {
      tytul,
      pytanie,
      deadline: deadline ? new Date(deadline) : null,
      createdBy: session.user.id,
      opcje: {
        create: opcje.map((tresc, i) => ({ tresc: String(tresc).trim(), kolejnosc: i })),
      },
    },
    include: { opcje: true },
  });

  // push notification do wszystkich subskrybentów
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { user: { notifAnkiety: true } } });
    const payload = JSON.stringify({
      title: "📊 Nowa ankieta",
      body: tytul,
      url: "/panel/ankiety/" + ankieta.id,
      tag: "ankiety",
      groupTitle: "📊 Ankiety",
      groupBody: "nowych ankiet",
    });

    await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        ).catch(() => prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {}))
      )
    );
  } catch {}

  return Response.json(ankieta, { status: 201 });
}

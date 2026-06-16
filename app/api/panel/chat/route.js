import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatEmitter } from "@/lib/chatEmitter";
import { randomBytes } from "crypto";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

function formatMsg(m, myId) {
  return {
    id: m.id,
    tresc: m.usunieta ? null : m.tresc,
    typ: m.typ,
    plik: m.usunieta ? null : m.plik,
    usunieta: m.usunieta,
    createdAt: m.createdAt,
    editedAt: m.editedAt,
    author: {
      id: m.author.id,
      name: m.author.player?.imieNazwisko ?? m.author.login,
      initials: (m.author.player?.imieNazwisko ?? m.author.login).charAt(0).toUpperCase(),
      foto: m.author.player?.foto ?? null,
      isMe: m.author.id === myId,
    },
    reakcje: m.reakcje.reduce((acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = { count: 0, mine: false };
      acc[r.emoji].count++;
      if (r.userId === myId) acc[r.emoji].mine = true;
      return acc;
    }, {}),
  };
}

export async function GET() {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const msgs = await prisma.chatWiadomosc.findMany({
    orderBy: { createdAt: "asc" },
    take: 150,
    include: {
      author: { select: { id: true, login: true, player: { select: { imieNazwisko: true, foto: true } } } },
      reakcje: true,
    },
  });

  const odczytania = await prisma.chatOdczytanie.findMany({
    include: { user: { select: { id: true, login: true, player: { select: { imieNazwisko: true } } } } },
  });

  return Response.json({
    messages: msgs.map((m) => formatMsg(m, session.user.id)),
    odczytania: odczytania.map((o) => ({
      userId: o.userId,
      name: o.user.player?.imieNazwisko ?? o.user.login,
      initials: (o.user.player?.imieNazwisko ?? o.user.login).charAt(0).toUpperCase(),
      ostatniaId: o.ostatniaId,
    })),
  });
}

export async function POST(request) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { tresc } = await request.json();
  if (!tresc?.trim()) return Response.json({ error: "Pusta wiadomość" }, { status: 400 });

  const msg = await prisma.chatWiadomosc.create({
    data: {
      id: randomBytes(8).toString("hex"),
      tresc: tresc.trim(),
      authorId: session.user.id,
    },
    include: {
      author: { select: { id: true, login: true, player: { select: { imieNazwisko: true, foto: true } } } },
      reakcje: true,
    },
  });

  const formatted = formatMsg(msg, session.user.id);
  chatEmitter.emit("event", { type: "message", data: formatted });

  sendPush(session.user.id, {
    title: formatted.author.name,
    body: tresc.trim().slice(0, 80),
    url: "/panel/chat",
  });

  return Response.json(formatted, { status: 201 });
}

async function sendPush(exceptUserId, payload) {
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { userId: { not: exceptUserId } } });
    const p = JSON.stringify(payload);
    await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, p)
          .catch(() => prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {}))
      )
    );
  } catch {}
}

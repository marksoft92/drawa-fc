import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dmEmitter } from "@/lib/dmEmitter";
import { randomBytes } from "crypto";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

function convKey(a, b) {
  return [a, b].sort().join(":");
}

async function getOrCreateConv(uid1, uid2) {
  const [u1, u2] = convKey(uid1, uid2);
  return prisma.privateConversation.upsert({
    where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    create: { user1Id: u1, user2Id: u2 },
    update: {},
  });
}

const INCLUDE_FULL = {
  author: { select: { id: true, login: true, player: { select: { imieNazwisko: true, foto: true } } } },
  reakcje: true,
  replyTo: {
    include: { author: { select: { login: true, player: { select: { imieNazwisko: true } } } } },
  },
};

function formatMsg(m, myId) {
  return {
    id: m.id,
    convId: m.convId,
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
    replyTo: m.replyTo ? {
      id: m.replyTo.id,
      tresc: m.replyTo.usunieta ? null : m.replyTo.tresc,
      typ: m.replyTo.typ,
      plik: m.replyTo.usunieta ? null : m.replyTo.plik,
      usunieta: m.replyTo.usunieta,
      authorName: m.replyTo.author?.player?.imieNazwisko ?? m.replyTo.author?.login ?? "?",
    } : null,
    reakcje: m.reakcje.reduce((acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = { count: 0, mine: false };
      acc[r.emoji].count++;
      if (r.userId === myId) acc[r.emoji].mine = true;
      return acc;
    }, {}),
  };
}

export async function GET(request, { params }) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const myId = session.user.id;
  const { userId } = await params;
  if (userId === myId) return Response.json({ error: "Nie możesz pisać do siebie" }, { status: 400 });

  const other = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, login: true, lastSeen: true, player: { select: { imieNazwisko: true, foto: true } } },
  });
  if (!other) return Response.json({ error: "Użytkownik nie istnieje" }, { status: 404 });

  const conv = await getOrCreateConv(myId, userId);

  const msgs = await prisma.privateWiadomosc.findMany({
    where: { convId: conv.id },
    orderBy: { createdAt: "asc" },
    take: 150,
    include: INCLUDE_FULL,
  });

  const otherName = other.player?.imieNazwisko ?? other.login;
  const online = other.lastSeen && (Date.now() - new Date(other.lastSeen)) / 60000 < 5;

  return Response.json({
    convId: conv.id,
    other: {
      id: other.id,
      name: otherName,
      initials: otherName.charAt(0).toUpperCase(),
      foto: other.player?.foto ?? null,
      online,
      lastSeen: other.lastSeen,
    },
    messages: msgs.map((m) => formatMsg(m, myId)),
  });
}

export async function POST(request, { params }) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const myId = session.user.id;
  const { userId } = await params;
  if (userId === myId) return Response.json({ error: "Nie możesz pisać do siebie" }, { status: 400 });

  const { tresc, replyToId } = await request.json();
  if (!tresc?.trim()) return Response.json({ error: "Pusta wiadomość" }, { status: 400 });

  const channel = convKey(myId, userId);
  const conv = await getOrCreateConv(myId, userId);

  const msg = await prisma.privateWiadomosc.create({
    data: {
      id: randomBytes(8).toString("hex"),
      convId: conv.id,
      tresc: tresc.trim(),
      authorId: myId,
      replyToId: replyToId ?? null,
    },
    include: INCLUDE_FULL,
  });

  const formatted = formatMsg(msg, myId);
  dmEmitter.emit(channel, { type: "message", data: formatted });

  // push do odbiorcy
  const myName = formatted.author.name;
  sendPush(userId, {
    title: myName,
    body: tresc.trim().slice(0, 80),
    url: `/panel/dm/${myId}`,
    tag: `dm-${myId}`,
    groupTitle: myName,
    groupBody: "nowych wiadomości",
  });

  return Response.json(formatted, { status: 201 });
}

async function sendPush(toUserId, payload) {
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { userId: toUserId } });
    const p = JSON.stringify(payload);
    await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, p)
          .catch(() => prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {}))
      )
    );
  } catch {}
}

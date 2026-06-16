import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dmEmitter } from "@/lib/dmEmitter";
import { randomBytes } from "crypto";
import { writeFile } from "fs/promises";
import path from "path";

function convKey(a, b) { return [a, b].sort().join(":"); }

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
  replyTo: { include: { author: { select: { login: true, player: { select: { imieNazwisko: true } } } } } },
};

function formatMsg(m, myId) {
  return {
    id: m.id, convId: m.convId,
    tresc: m.usunieta ? null : m.tresc, typ: m.typ,
    plik: m.usunieta ? null : m.plik, usunieta: m.usunieta,
    createdAt: m.createdAt, editedAt: m.editedAt,
    author: {
      id: m.author.id,
      name: m.author.player?.imieNazwisko ?? m.author.login,
      initials: (m.author.player?.imieNazwisko ?? m.author.login).charAt(0).toUpperCase(),
      foto: m.author.player?.foto ?? null,
      isMe: m.author.id === myId,
    },
    replyTo: null,
    reakcje: {},
  };
}

export async function POST(request, { params }) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const myId = session.user.id;
  const { userId } = await params;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file) return Response.json({ error: "Brak pliku" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) return Response.json({ error: "Nieobsługiwany format" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return Response.json({ error: "Max 10MB" }, { status: 400 });

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const name = `dm-${randomBytes(8).toString("hex")}.${ext}`;
  const dest = path.join(process.cwd(), "public", "uploads", name);
  await writeFile(dest, Buffer.from(await file.arrayBuffer()));

  const conv = await getOrCreateConv(myId, userId);

  const msg = await prisma.privateWiadomosc.create({
    data: {
      id: randomBytes(8).toString("hex"),
      convId: conv.id,
      typ: "image",
      plik: `/uploads/${name}`,
      authorId: myId,
    },
    include: INCLUDE_FULL,
  });

  const channel = convKey(myId, userId);
  const formatted = formatMsg(msg, myId);
  dmEmitter.emit(channel, { type: "message", data: formatted });
  return Response.json(formatted, { status: 201 });
}

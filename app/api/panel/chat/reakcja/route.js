import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatEmitter } from "@/lib/chatEmitter";
import { randomBytes } from "crypto";

const ALLOWED_EMOJI = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export async function POST(request) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { wiadId, emoji } = await request.json();
  if (!wiadId || !ALLOWED_EMOJI.includes(emoji)) {
    return Response.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }

  const existing = await prisma.chatReakcja.findUnique({
    where: { wiadId_userId_emoji: { wiadId, userId: session.user.id, emoji } },
  });

  if (existing) {
    await prisma.chatReakcja.delete({ where: { id: existing.id } });
  } else {
    await prisma.chatReakcja.create({
      data: { id: randomBytes(6).toString("hex"), wiadId, userId: session.user.id, emoji },
    });
  }

  const reakcje = await prisma.chatReakcja.findMany({ where: { wiadId } });
  const grouped = reakcje.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, mine: false };
    acc[r.emoji].count++;
    if (r.userId === session.user.id) acc[r.emoji].mine = true;
    return acc;
  }, {});

  chatEmitter.emit("event", { type: "reakcja", wiadId, reakcje: grouped });

  return Response.json({ reakcje: grouped });
}

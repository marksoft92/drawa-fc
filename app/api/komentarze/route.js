import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BADGE_EMOJI = ["⚽", "🏆", "💪", "🔥", "🎯"];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const typ = searchParams.get("typ");
  const targetId = searchParams.get("targetId");

  if (!typ || !targetId) return Response.json({ komentarze: [] });

  const rows = await prisma.komentarz.findMany({
    where: { typ, targetId, zatwierdzony: true },
    orderBy: { createdAt: "asc" },
    include: { reakcje: true },
  });

  const komentarze = rows.map((k) => {
    const reakcje = {};
    for (const r of k.reakcje) {
      reakcje[r.emoji] = (reakcje[r.emoji] || 0) + 1;
    }
    return { id: k.id, nick: k.nick, tresc: k.tresc, emoji: k.emoji, odpowiedz: k.odpowiedz, createdAt: k.createdAt, reakcje };
  });

  return Response.json({ komentarze });
}

export async function POST(req) {
  const body = await req.json();
  const { typ, targetId, nick, tresc, emoji } = body;

  if (!typ || !targetId || !["artykul", "mecz"].includes(typ)) {
    return Response.json({ error: "Nieprawidłowy typ" }, { status: 400 });
  }
  if (!nick?.trim() || nick.trim().length < 2 || nick.trim().length > 30) {
    return Response.json({ error: "Nick: 2-30 znaków" }, { status: 400 });
  }
  if (!tresc?.trim() || tresc.trim().length > 500) {
    return Response.json({ error: "Komentarz: 1-500 znaków" }, { status: 400 });
  }
  if (emoji && !BADGE_EMOJI.includes(emoji)) {
    return Response.json({ error: "Nieprawidłowy emoji" }, { status: 400 });
  }

  await prisma.komentarz.create({
    data: {
      typ,
      targetId,
      nick: nick.trim(),
      tresc: tresc.trim(),
      emoji: emoji || null,
    },
  });

  return Response.json({ ok: true, message: "Komentarz wysłany do weryfikacji" }, { status: 201 });
}

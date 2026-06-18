import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_EMOJI = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export async function POST(req) {
  const { komentarzId, emoji, fingerprintId } = await req.json();

  if (!komentarzId || !emoji || !fingerprintId) {
    return Response.json({ error: "Brak danych" }, { status: 400 });
  }
  if (!ALLOWED_EMOJI.includes(emoji)) {
    return Response.json({ error: "Nieprawidłowy emoji" }, { status: 400 });
  }

  const komentarz = await prisma.komentarz.findUnique({ where: { id: komentarzId } });
  if (!komentarz || !komentarz.zatwierdzony) {
    return Response.json({ error: "Nie znaleziono" }, { status: 404 });
  }

  const existing = await prisma.komentarzReakcja.findUnique({
    where: { komentarzId_fingerprintId_emoji: { komentarzId, fingerprintId, emoji } },
  });

  if (existing) {
    await prisma.komentarzReakcja.delete({ where: { id: existing.id } });
  } else {
    await prisma.komentarzReakcja.create({
      data: { komentarzId, emoji, fingerprintId },
    });
  }

  const all = await prisma.komentarzReakcja.findMany({ where: { komentarzId } });
  const reakcje = {};
  for (const r of all) reakcje[r.emoji] = (reakcje[r.emoji] || 0) + 1;

  return Response.json({ reakcje });
}

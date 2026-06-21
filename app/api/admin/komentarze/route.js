import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!(await hasAccess("komentarze"))) return Response.json({ error: "Brak dostępu" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";

  const where =
    status === "pending" ? { zatwierdzony: false } :
    status === "approved" ? { zatwierdzony: true } : {};

  const komentarze = await prisma.komentarz.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const artykulIds = komentarze.filter((k) => k.typ === "artykul").map((k) => k.targetId);
  const meczIds = komentarze.filter((k) => k.typ === "mecz").map((k) => k.targetId);

  const [artykuly, mecze] = await Promise.all([
    artykulIds.length > 0
      ? prisma.artykul.findMany({ where: { id: { in: artykulIds } }, select: { id: true, title: true } })
      : [],
    meczIds.length > 0
      ? prisma.mecz.findMany({ where: { id: { in: meczIds } }, select: { id: true, team1: true, team2: true, score: true, date: true } })
      : [],
  ]);

  const artykulMap = Object.fromEntries(artykuly.map((a) => [a.id, a.title]));
  const meczMap = Object.fromEntries(mecze.map((m) => [m.id, `${m.team1} ${m.score || "vs"} ${m.team2} (${m.date || ""})`]));

  const enriched = komentarze.map((k) => ({
    ...k,
    targetLabel: k.typ === "artykul" ? artykulMap[k.targetId] : meczMap[k.targetId] || k.targetId,
  }));

  return Response.json({ komentarze: enriched });
}

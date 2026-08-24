import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!(await hasAccess("liga"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const sezon = new URL(request.url).searchParams.get("sezon") || "2025/26";
  const mecze = await prisma.mecz.findMany({ where: { sezon }, orderBy: { createdAt: "asc" } });
  return Response.json(mecze);
}

export async function POST(request) {
  if (!(await hasAccess("liga"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { sezon = "2025/26", mecze } = await request.json();
  if (!Array.isArray(mecze) || mecze.length === 0)
    return Response.json({ error: "Brak danych meczów" }, { status: 400 });

  let upserted = 0;
  for (const m of mecze) {
    if (!m.team1 || !m.team2) continue;
    const date = m.date || "";
    const fields = {
      herb1: m.herb1 || null,
      herb2: m.herb2 || null,
      score: m.score || null,
      date,
      walkower: Boolean(m.walkower),
      status: m.status || null,
      komentarz: m.komentarz || null,
      liga: m.liga || null,
      strzelcy: Array.isArray(m.strzelcy) ? m.strzelcy : [],
      kartki: Array.isArray(m.kartki) ? m.kartki : [],
      zmiany: Array.isArray(m.zmiany) ? m.zmiany : [],
      wszystkieZdarzenia: Array.isArray(m.wszystkieZdarzenia) ? m.wszystkieZdarzenia : [],
      sklady: m.sklady && typeof m.sklady === "object" ? m.sklady : {},
    };

    const existing = await prisma.mecz.findUnique({
      where: { sezon_team1_team2_date: { sezon, team1: m.team1, team2: m.team2, date } },
    });

    // Terminarz bywa scrapowany zanim wynik/godzina są znane (np. "22 sie ?:?"),
    // a późniejszy scrape przynosi doprecyzowaną datę — to inny string, więc bez
    // tego dopasowania upsert po (sezon, team1, team2, date) tworzyłby duplikat
    // zamiast nadpisać starą, nieaktualną zapowiedź meczu.
    const stale = existing
      ? null
      : await prisma.mecz.findFirst({
          where: { sezon, team1: m.team1, team2: m.team2, score: null, walkower: false },
        });

    const targetId = existing?.id ?? stale?.id;

    if (targetId) {
      await prisma.mecz.update({ where: { id: targetId }, data: fields });
    } else {
      await prisma.mecz.create({ data: { sezon, team1: m.team1, team2: m.team2, ...fields } });
    }
    upserted++;
  }
  return Response.json({ ok: true, upserted });
}

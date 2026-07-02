import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 14;

export async function GET(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, include: { player: true } });
  if (!user?.player) return Response.json({ error: "Nie znaleziono gracza" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const before = searchParams.get("before");

  const days = await prisma.playerHealthDaily.findMany({
    where: {
      playerId: user.player.id,
      ...(before ? { date: { lt: new Date(before) } } : {}),
    },
    orderBy: { date: "desc" },
    take: PAGE_SIZE + 1,
    select: {
      id: true,
      date: true,
      steps: true,
      activeCalories: true,
      distanceMeters: true,
      sleepMinutes: true,
      heartRateAvg: true,
      heartRateMax: true,
    },
  });

  const hasMore = days.length > PAGE_SIZE;
  const page = days.slice(0, PAGE_SIZE);

  return Response.json({
    days: page,
    nextCursor: hasMore ? page[page.length - 1].date : null,
  });
}

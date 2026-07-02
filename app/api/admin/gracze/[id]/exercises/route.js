import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export async function GET(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { player: { select: { id: true, imieNazwisko: true, pozycja: true, numer: true, foto: true } } },
  });
  if (!user?.player) return Response.json({ error: "Nie znaleziono gracza" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const before = searchParams.get("before");

  const exercises = await prisma.playerExerciseSession.findMany({
    where: {
      playerId: user.player.id,
      ...(before ? { startTime: { lt: new Date(before) } } : {}),
    },
    orderBy: { startTime: "desc" },
    take: PAGE_SIZE + 1,
    select: {
      id: true,
      exerciseType: true,
      startTime: true,
      endTime: true,
      durationSeconds: true,
      heartRateAvg: true,
      heartRateMax: true,
      heartRateMin: true,
    },
  });

  const hasMore = exercises.length > PAGE_SIZE;
  const page = exercises.slice(0, PAGE_SIZE);

  return Response.json({
    player: user.player,
    exercises: page,
    nextCursor: hasMore ? page[page.length - 1].startTime : null,
  });
}

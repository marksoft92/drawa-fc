import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const TZ = "Europe/Warsaw";

function todayBucket() {
  const local = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
  return new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate()));
}

export async function GET(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, include: { player: true } });
  if (!user?.player) return Response.json({ error: "Nie znaleziono gracza" }, { status: 404 });

  const [today, exercises] = await Promise.all([
    prisma.playerHealthDaily.findUnique({
      where: { playerId_date: { playerId: user.player.id, date: todayBucket() } },
    }),
    prisma.playerExerciseSession.findMany({
      where: { playerId: user.player.id },
      orderBy: { startTime: "desc" },
      take: 5,
      select: {
        id: true,
        exerciseType: true,
        startTime: true,
        endTime: true,
        durationSeconds: true,
        heartRateAvg: true,
        heartRateMax: true,
      },
    }),
  ]);

  return Response.json({ healthToken: user.player.healthToken, today, exercises });
}

export async function POST(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, include: { player: true } });
  if (!user?.player) return Response.json({ error: "Nie znaleziono gracza" }, { status: 404 });

  const token = crypto.randomBytes(24).toString("hex");
  const player = await prisma.player.update({
    where: { id: user.player.id },
    data: { healthToken: token },
  });

  return Response.json({ healthToken: player.healthToken });
}

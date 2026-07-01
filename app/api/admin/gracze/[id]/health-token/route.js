import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function todayBucket() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function GET(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, include: { player: true } });
  if (!user?.player) return Response.json({ error: "Nie znaleziono gracza" }, { status: 404 });

  const today = await prisma.playerHealthDaily.findUnique({
    where: { playerId_date: { playerId: user.player.id, date: todayBucket() } },
  });

  return Response.json({ healthToken: user.player.healthToken, today });
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

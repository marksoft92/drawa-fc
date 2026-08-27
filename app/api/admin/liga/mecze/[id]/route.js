import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyAll } from "@/lib/pushNotify";

export const dynamic = "force-dynamic";

function totalGoals(score) {
  if (!score) return null;
  const parts = score.split(":").map((n) => parseInt(n.trim(), 10));
  if (parts.length !== 2 || parts.some(Number.isNaN)) return null;
  return parts[0] + parts[1];
}

export async function GET(request, { params }) {
  if (!(await hasAccess("liga"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const mecz = await prisma.mecz.findUnique({ where: { id } });
  if (!mecz) return Response.json({ error: "Nie znaleziono" }, { status: 404 });
  return Response.json(mecz);
}

export async function PATCH(request, { params }) {
  if (!(await hasAccess("liga"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  const before = await prisma.mecz.findUnique({ where: { id } });

  const data = {};
  if (body.score !== undefined) data.score = body.score || null;
  if (body.status !== undefined) data.status = body.status || null;
  if (body.komentarz !== undefined) data.komentarz = body.komentarz || null;
  if (body.walkower !== undefined) data.walkower = Boolean(body.walkower);
  if (body.strzelcy !== undefined) data.strzelcy = body.strzelcy;
  if (body.kartki !== undefined) data.kartki = body.kartki;
  if (body.zmiany !== undefined) data.zmiany = body.zmiany;
  if (body.date !== undefined) data.date = body.date;
  const mecz = await prisma.mecz.update({ where: { id }, data });

  if (before) {
    const url = `/liga/mecz/${id}`;
    const golyBefore = totalGoals(before.score);
    const golyAfter = totalGoals(mecz.score);
    if (golyAfter !== null && (golyBefore === null || golyAfter > golyBefore)) {
      notifyAll({
        title: "⚽ GOL!",
        body: `${mecz.team1} ${mecz.score} ${mecz.team2}`,
        url,
        tag: `gol-${id}`,
      }).catch(() => {});
    } else if (before.status !== "live" && mecz.status === "live") {
      notifyAll({
        title: "🟢 Mecz rozpoczęty",
        body: `${mecz.team1} vs ${mecz.team2}`,
        url,
        tag: `start-${id}`,
      }).catch(() => {});
    }
  }

  return Response.json(mecz);
}

export async function DELETE(request, { params }) {
  if (!(await hasAccess("liga"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  await prisma.mecz.delete({ where: { id } });
  return Response.json({ ok: true });
}

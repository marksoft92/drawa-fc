import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function obliczPunkty(predG1, predG2, actualG1, actualG2) {
  if (predG1 === actualG1 && predG2 === actualG2) return 3;
  const predSign = Math.sign(predG1 - predG2);
  const actualSign = Math.sign(actualG1 - actualG2);
  if (predSign !== actualSign) return 0;
  if (predG1 - predG2 === actualG1 - actualG2) return 2;
  return 1;
}

export async function PATCH(req, { params }) {
  if (!(await hasAccess("typowanie"))) return Response.json({ error: "Brak dostępu" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.typowanie.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Nie znaleziono" }, { status: 404 });

  const update = {};
  if (body.team1 !== undefined) update.team1 = body.team1.trim();
  if (body.team2 !== undefined) update.team2 = body.team2.trim();
  if (body.herb1 !== undefined) update.herb1 = body.herb1?.trim() || null;
  if (body.herb2 !== undefined) update.herb2 = body.herb2?.trim() || null;
  if (body.dataRozpoczecia !== undefined) {
    const d = new Date(body.dataRozpoczecia);
    if (!isNaN(d.getTime())) update.dataRozpoczecia = d;
  }
  if (body.aktywne !== undefined) update.aktywne = !!body.aktywne;

  const enteringResult =
    body.wynikTeam1 !== undefined &&
    body.wynikTeam2 !== undefined &&
    Number.isInteger(body.wynikTeam1) &&
    Number.isInteger(body.wynikTeam2) &&
    body.wynikTeam1 >= 0 &&
    body.wynikTeam2 >= 0;

  if (enteringResult) {
    update.wynikTeam1 = body.wynikTeam1;
    update.wynikTeam2 = body.wynikTeam2;

    const wpisy = await prisma.typowanieWpis.findMany({ where: { typowanieId: id } });

    await prisma.$transaction([
      prisma.typowanie.update({ where: { id }, data: update }),
      ...wpisy.map((w) =>
        prisma.typowanieWpis.update({
          where: { id: w.id },
          data: { punkty: obliczPunkty(w.golTeam1, w.golTeam2, body.wynikTeam1, body.wynikTeam2) },
        })
      ),
    ]);

    const updated = await prisma.typowanie.findUnique({
      where: { id },
      include: { _count: { select: { wpisy: true } } },
    });
    return Response.json(updated);
  }

  const updated = await prisma.typowanie.update({
    where: { id },
    data: update,
    include: { _count: { select: { wpisy: true } } },
  });
  return Response.json(updated);
}

export async function DELETE(req, { params }) {
  if (!(await hasAccess("typowanie"))) return Response.json({ error: "Brak dostępu" }, { status: 403 });

  const { id } = await params;
  await prisma.typowanie.delete({ where: { id } }).catch(() => null);
  return Response.json({ ok: true });
}

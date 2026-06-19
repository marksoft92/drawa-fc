import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const { email } = await request.json();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Podaj poprawny adres email" }, { status: 400 });
  }

  const existing = await prisma.newsletterSub.findUnique({ where: { email } });
  if (existing) {
    if (!existing.active) {
      await prisma.newsletterSub.update({ where: { email }, data: { active: true } });
      return Response.json({ ok: true, msg: "Ponownie zapisano do newslettera" });
    }
    return Response.json({ ok: true, msg: "Ten email jest już zapisany" });
  }

  await prisma.newsletterSub.create({ data: { email } });
  return Response.json({ ok: true, msg: "Zapisano do newslettera" });
}

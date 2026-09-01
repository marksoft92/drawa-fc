import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!(await hasAccess("sponsorzy"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const leady = await prisma.sponsorLead.findMany({
    where: status ? { status } : undefined,
    include: {
      notatki: { orderBy: { createdAt: "desc" }, include: { author: { select: { login: true, player: { select: { imieNazwisko: true } } } } } },
      sponsor: { select: { id: true, nazwa: true, slug: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });
  return Response.json(leady);
}

export async function POST(request) {
  if (!(await hasAccess("sponsorzy"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { nazwa, osobaKontaktowa, telefon, email, www, adres, zrodlo, wartosc, nastepnyKontakt } = await request.json();
  if (!nazwa?.trim()) return Response.json({ error: "Nazwa jest wymagana" }, { status: 400 });

  const lead = await prisma.sponsorLead.create({
    data: {
      nazwa: nazwa.trim(),
      osobaKontaktowa: osobaKontaktowa?.trim() || null,
      telefon: telefon?.trim() || null,
      email: email?.trim() || null,
      www: www?.trim() || null,
      adres: adres?.trim() || null,
      zrodlo: zrodlo?.trim() || null,
      wartosc: wartosc !== undefined && wartosc !== "" ? Number(wartosc) || null : null,
      nastepnyKontakt: nastepnyKontakt ? new Date(nastepnyKontakt) : null,
    },
  });
  return Response.json(lead, { status: 201 });
}

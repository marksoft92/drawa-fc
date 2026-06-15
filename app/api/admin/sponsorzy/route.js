import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const sponsorzy = await prisma.sponsor.findMany({
    orderBy: [{ kolejnosc: "asc" }, { createdAt: "asc" }],
  });
  return Response.json(sponsorzy);
}

export async function POST(request) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { nazwa, logo, href, kolejnosc, aktywny } = await request.json();
  if (!nazwa?.trim()) return Response.json({ error: "Nazwa jest wymagana" }, { status: 400 });
  const sponsor = await prisma.sponsor.create({
    data: {
      nazwa: nazwa.trim(),
      logo: logo?.trim() || null,
      href: href?.trim() || null,
      kolejnosc: Number(kolejnosc) || 0,
      aktywny: aktywny !== false,
    },
  });
  return Response.json(sponsor, { status: 201 });
}

import { hasAccess, getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  if (!(await hasAccess("sponsorzy"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const { tresc } = await request.json();
  if (!tresc?.trim()) return Response.json({ error: "Treść notatki jest wymagana" }, { status: 400 });

  const session = await getPlayerSession();
  const note = await prisma.sponsorLeadNote.create({
    data: { leadId: id, tresc: tresc.trim(), authorId: session?.user?.id || null },
    include: { author: { select: { login: true, player: { select: { imieNazwisko: true } } } } },
  });
  return Response.json(note, { status: 201 });
}

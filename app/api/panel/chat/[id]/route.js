import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatEmitter } from "@/lib/chatEmitter";

export async function DELETE(request, { params }) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { id } = await params;
  const msg = await prisma.chatWiadomosc.findUnique({ where: { id } });
  if (!msg) return Response.json({ error: "Nie znaleziono" }, { status: 404 });

  const canDelete = msg.authorId === session.user.id || session.user.role === "ADMIN";
  if (!canDelete) return Response.json({ error: "Brak uprawnień" }, { status: 403 });

  await prisma.chatWiadomosc.update({
    where: { id },
    data: { usunieta: true, tresc: null, plik: null },
  });

  chatEmitter.emit("event", { type: "delete", id });

  return Response.json({ ok: true });
}

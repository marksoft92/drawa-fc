import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const u = session.user;
  return Response.json({
    email: u.email ?? null,
    showOnline: u.showOnline ?? true,
    notifChat: u.notifChat ?? true,
    notifDm: u.notifDm ?? true,
    notifAnkiety: u.notifAnkiety ?? true,
  });
}

export async function PATCH(request) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const myId = session.user.id;

  const body = await request.json();
  const update = {};

  // zmiana email – wymaga potwierdzenia hasłem
  if (body.email !== undefined) {
    if (!body.currentPassword) return Response.json({ error: "Podaj aktualne hasło" }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { id: myId } });
    const ok = await bcrypt.compare(body.currentPassword, user.password);
    if (!ok) return Response.json({ error: "Błędne hasło" }, { status: 400 });
    const newEmail = body.email.trim() || null;
    if (newEmail) {
      const exists = await prisma.user.findFirst({ where: { email: newEmail, NOT: { id: myId } } });
      if (exists) return Response.json({ error: "Ten email jest już zajęty" }, { status: 409 });
    }
    update.email = newEmail;
  }

  // flagi bez hasła
  if (typeof body.showOnline === "boolean") update.showOnline = body.showOnline;
  if (typeof body.notifChat === "boolean") update.notifChat = body.notifChat;
  if (typeof body.notifDm === "boolean") update.notifDm = body.notifDm;
  if (typeof body.notifAnkiety === "boolean") update.notifAnkiety = body.notifAnkiety;

  if (Object.keys(update).length === 0) return Response.json({ error: "Brak zmian" }, { status: 400 });

  await prisma.user.update({ where: { id: myId }, data: update });
  return Response.json({ ok: true });
}

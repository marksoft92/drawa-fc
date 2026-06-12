import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request) {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Nie jesteś zalogowany" }, { status: 401 });

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return Response.json({ error: "Podaj aktualne i nowe hasło" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return Response.json({ error: "Nowe hasło musi mieć min. 6 znaków" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return Response.json({ error: "Aktualne hasło jest nieprawidłowe" }, { status: 400 });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: session.userId },
    data: { password: hash, mustChangePassword: false },
  });

  return Response.json({ ok: true });
}

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request) {
  const { login, password } = await request.json();

  const user = await prisma.user.findUnique({
    where: { login },
    include: { player: true },
  });

  if (!user || !user.active) {
    return Response.json({ error: "Nieprawidłowy login lub hasło" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return Response.json({ error: "Nieprawidłowy login lub hasło" }, { status: 401 });
  }

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  const session = await prisma.session.create({
    data: { userId: user.id, expiresAt },
  });

  const store = await cookies();
  store.set("player_session", session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return Response.json({
    id: user.id,
    login: user.login,
    role: user.role,
    player: user.player,
  });
}

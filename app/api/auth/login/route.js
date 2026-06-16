import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const SESSION_MAX = 1000 * 60 * 60 * 24 * 30; // 30 dni

async function createSession(userId) {
  const expiresAt = new Date(Date.now() + SESSION_MAX);
  const session = await prisma.session.create({ data: { userId, expiresAt } });
  const store = await cookies();
  store.set("player_session", session.token, {
    httpOnly: true, sameSite: "lax", path: "/",
    expires: expiresAt,
  });
  return session;
}

export async function POST(request) {
  const { login, password } = await request.json();
  if (!login || !password) {
    return Response.json({ error: "Podaj login i hasło" }, { status: 400 });
  }

  // Admin z .env
  if (
    login === process.env.STREAM_ADMIN_LOGIN &&
    password === process.env.STREAM_ADMIN_PASSWORD
  ) {
    const hash = await bcrypt.hash(password, 10);
    const adminUser = await prisma.user.upsert({
      where: { login },
      create: { login, password: hash, role: "ADMIN", mustChangePassword: false },
      update: { role: "ADMIN" },
    });
    await createSession(adminUser.id);
    return Response.json({ redirect: "/panel" });
  }

  // Gracze i sztab z bazy
  const user = await prisma.user.findUnique({ where: { login } });

  if (!user || !user.active) {
    return Response.json({ error: "Nieprawidłowy login lub hasło" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return Response.json({ error: "Nieprawidłowy login lub hasło" }, { status: 401 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastSeen: new Date() } });
  await createSession(user.id);
  return Response.json({ redirect: "/panel" });
}

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request) {
  const { login, password } = await request.json();

  if (!login || !password) {
    return Response.json({ error: "Podaj login i hasło" }, { status: 400 });
  }

  // Admin z .env — osobna procedura, cookie stream_session
  if (
    login === process.env.STREAM_ADMIN_LOGIN &&
    password === process.env.STREAM_ADMIN_PASSWORD
  ) {
    const token = Buffer.from(`${login}:${password}`).toString("base64");
    const store = await cookies();
    store.set("stream_session", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return Response.json({ role: "ADMIN", redirect: "/admin" });
  }

  // Konta z bazy danych (piłkarze, sztab)
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

  const redirect = user.role === "ADMIN" ? "/admin" : "/konto";
  return Response.json({
    role: user.role,
    redirect,
    login: user.login,
    player: user.player,
  });
}

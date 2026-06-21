import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const users = await prisma.user.findMany({
    include: { player: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(users.map((u) => ({
    id: u.id,
    login: u.login,
    email: u.email,
    role: u.role,
    uprawnienia: u.uprawnienia,
    active: u.active,
    createdAt: u.createdAt,
    player: u.player ? {
      imieNazwisko: u.player.imieNazwisko,
      pozycja: u.player.pozycja,
      numer: u.player.numer,
      dataUrodzenia: u.player.dataUrodzenia,
    } : null,
  })));
}

export async function POST(request) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { login, email, password, role, uprawnienia, imieNazwisko, pozycja, numer, dataUrodzenia } =
    await request.json();

  if (!login || !password || !imieNazwisko) {
    return Response.json({ error: "Login, hasło i imię są wymagane" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { login } });
  if (exists) return Response.json({ error: "Login jest już zajęty" }, { status: 409 });

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      login,
      email: email || null,
      password: hash,
      role: role ?? "PLAYER",
      uprawnienia: Array.isArray(uprawnienia) ? uprawnienia : [],
      player: {
        create: {
          imieNazwisko,
          pozycja: pozycja || null,
          numer: numer ? Number(numer) : null,
          dataUrodzenia: dataUrodzenia ? new Date(dataUrodzenia) : null,
        },
      },
    },
    include: { player: true },
  });

  return Response.json({
    id: user.id,
    login: user.login,
    email: user.email,
    role: user.role,
    active: user.active,
    player: user.player,
  }, { status: 201 });
}

import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { login, email, role, uprawnienia, active, newPassword, mustChangePassword, imieNazwisko, pozycja, numer, dataUrodzenia } = body;

  const userUpdate = {};
  if (login !== undefined && login.trim()) {
    const exists = await prisma.user.findFirst({ where: { login: login.trim(), NOT: { id } } });
    if (exists) return Response.json({ error: "Login jest już zajęty" }, { status: 409 });
    userUpdate.login = login.trim();
  }
  if (email !== undefined) userUpdate.email = email || null;
  if (role !== undefined) userUpdate.role = role;
  if (uprawnienia !== undefined) userUpdate.uprawnienia = Array.isArray(uprawnienia) ? uprawnienia : [];
  if (active !== undefined) userUpdate.active = active;
  if (newPassword) {
    userUpdate.password = await bcrypt.hash(newPassword, 10);
    userUpdate.mustChangePassword = mustChangePassword !== undefined ? mustChangePassword : true;
  }

  const playerUpdate = {};
  if (imieNazwisko !== undefined) playerUpdate.imieNazwisko = imieNazwisko;
  if (pozycja !== undefined) playerUpdate.pozycja = pozycja || null;
  if (numer !== undefined) playerUpdate.numer = numer ? Number(numer) : null;
  if (dataUrodzenia !== undefined) playerUpdate.dataUrodzenia = dataUrodzenia ? new Date(dataUrodzenia) : null;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...userUpdate,
      player: Object.keys(playerUpdate).length
        ? { update: playerUpdate }
        : undefined,
    },
    include: { player: true },
  });

  return Response.json({ ok: true, user });
}

export async function DELETE(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { id } = await params;
  await prisma.user.update({ where: { id }, data: { active: false } });
  return Response.json({ ok: true });
}

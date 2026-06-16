import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function getPlayerSession() {
  const store = await cookies();
  const token = store.get("player_session")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { player: true } } },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getPlayerSession();
  return session?.user.role === "ADMIN";
}

export async function isAdminOrStaff(): Promise<boolean> {
  const session = await getPlayerSession();
  return session?.user.role === "ADMIN" || session?.user.role === "STAFF";
}

import { cookies } from "next/headers";
import { prisma } from "./prisma";

let lastCleanup = 0;
const CLEANUP_INTERVAL = 1000 * 60 * 60; // 1h

async function cleanupExpiredSessions() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
}

export async function getPlayerSession() {
  const store = await cookies();
  const token = store.get("player_session")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { player: true } } },
  });

  if (!session || session.expiresAt < new Date()) return null;

  cleanupExpiredSessions();

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

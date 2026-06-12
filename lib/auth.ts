import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get("stream_session")?.value;
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [login, password] = decoded.split(":");
    return (
      login === process.env.STREAM_ADMIN_LOGIN &&
      password === process.env.STREAM_ADMIN_PASSWORD
    );
  } catch {
    return false;
  }
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
  return session;
}

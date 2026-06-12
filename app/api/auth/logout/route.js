import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const store = await cookies();
  const token = store.get("player_session")?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {});
    store.delete("player_session");
  }
  return Response.json({ ok: true });
}

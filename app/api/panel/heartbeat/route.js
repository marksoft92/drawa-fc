import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getPlayerSession();
  if (!session) return Response.json({ ok: false }, { status: 401 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastSeen: new Date() },
  });

  return Response.json({ ok: true });
}

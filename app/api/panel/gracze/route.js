import { getPlayerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getPlayerSession();
  if (!session) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const users = await prisma.user.findMany({
    where: { active: true },
    include: {
      player: { select: { imieNazwisko: true, pozycja: true, numer: true, foto: true } },
    },
    orderBy: [{ player: { numer: "asc" } }, { createdAt: "asc" }],
  });

  return Response.json({
    currentRole: session.user.role,
    users: users.map((u) => ({
      id: u.id,
      login: u.login,
      email: u.email,
      role: u.role,
      active: u.active,
      lastSeen: u.lastSeen,
      createdAt: u.createdAt,
      player: u.player
        ? {
            imieNazwisko: u.player.imieNazwisko,
            pozycja: u.player.pozycja,
            numer: u.player.numer,
            foto: u.player.foto,
          }
        : null,
    })),
  });
}

import { getPlayerSession } from "@/lib/auth";

export async function GET() {
  const session = await getPlayerSession();
  if (!session) return Response.json({ user: null });

  const { user } = session;
  return Response.json(
    {
      user: {
        id: user.id,
        login: user.login,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        player: user.player,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

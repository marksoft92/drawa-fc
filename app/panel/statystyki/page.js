import { getPlayerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import StatystykiClient from "./StatystykiClient";

export default async function StatystykiPage() {
  const session = await getPlayerSession();
  if (!session) redirect("/login");

  const { user } = session;
  if (!user.player) redirect("/panel/profil");

  return <StatystykiClient playerId={user.player.id} />;
}

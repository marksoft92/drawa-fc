import { getPlayerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfilClient from "./ProfilClient";

export default async function ProfilPage() {
  const session = await getPlayerSession();
  if (!session) redirect("/login");

  const { user } = session;
  return (
    <ProfilClient
      login={user.login}
      email={user.email ?? null}
      role={user.role}
      player={user.player ? {
        imieNazwisko: user.player.imieNazwisko,
        pozycja: user.player.pozycja ?? null,
        numer: user.player.numer ?? null,
        foto: user.player.foto ?? null,
      } : null}
      showOnline={user.showOnline ?? true}
      notifChat={user.notifChat ?? true}
      notifDm={user.notifDm ?? true}
      notifAnkiety={user.notifAnkiety ?? true}
    />
  );
}

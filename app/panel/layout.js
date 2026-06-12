import { getPlayerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PanelLayoutClient from "./PanelLayoutClient";

export default async function PanelLayout({ children }) {
  const session = await getPlayerSession();
  if (!session) redirect("/login?next=/panel");

  const { user } = session;
  return (
    <PanelLayoutClient role={user.role} login={user.login} name={user.player?.imieNazwisko || null}>
      {children}
    </PanelLayoutClient>
  );
}

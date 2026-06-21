export const metadata = {
  robots: { index: false, follow: false },
};

import { getPlayerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PanelLayoutClient from "./PanelLayoutClient";

export default async function PanelLayout({ children }) {
  const session = await getPlayerSession();
  if (!session) redirect("/login?next=/panel");

  const { user } = session;
  return (
    <PanelLayoutClient role={user.role} uprawnienia={user.uprawnienia || []} login={user.login} name={user.player?.imieNazwisko || null} foto={user.player?.foto || null}>
      {children}
    </PanelLayoutClient>
  );
}

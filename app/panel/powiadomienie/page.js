import { getPlayerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PowiadomienieClient from "./PowiadomienieClient";

export default async function PowiadomieniePage() {
  const session = await getPlayerSession();
  if (!session) redirect("/login");
  if (!["ADMIN", "STAFF"].includes(session.user.role)) redirect("/panel");
  return <PowiadomienieClient senderName={session.user.player?.imieNazwisko ?? session.user.login} />;
}

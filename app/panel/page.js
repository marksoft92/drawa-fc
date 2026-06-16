import { getPlayerSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PanelIndex() {
  const session = await getPlayerSession();
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/panel/gracze");
  if (session.user.role === "STAFF") redirect("/panel/ankiety");
  redirect("/panel/profil");
}

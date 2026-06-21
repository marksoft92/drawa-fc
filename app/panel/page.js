import { getPlayerSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PanelIndex() {
  const session = await getPlayerSession();
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/panel/gracze");
  if (session.user.role === "STAFF") redirect("/panel/ankiety");
  const upr = session.user.uprawnienia;
  if (upr?.length > 0) redirect(`/panel/${upr[0]}`);
  redirect("/panel/profil");
}

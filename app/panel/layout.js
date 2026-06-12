import { getPlayerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PanelLayoutClient from "./PanelLayoutClient";

export default async function PanelLayout({ children }) {
  const session = await getPlayerSession();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login?next=/panel");
  }
  return <PanelLayoutClient>{children}</PanelLayoutClient>;
}

import { getPlayerSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function GraczeLayout({ children }) {
  const session = await getPlayerSession();
  if (!session) redirect("/login");
  return children;
}

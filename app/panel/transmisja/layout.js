import { hasAccess } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TransmisjaLayout({ children }) {
  if (!(await hasAccess("transmisja"))) redirect("/panel");
  return children;
}

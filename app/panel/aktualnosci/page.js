import { hasAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import AktualnosciAdmin from "./AktualnosciAdmin";

export default async function AktualnosciPage() {
  if (!(await hasAccess("aktualnosci"))) redirect("/panel");
  return <AktualnosciAdmin />;
}

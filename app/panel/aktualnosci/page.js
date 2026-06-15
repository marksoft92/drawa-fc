import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import AktualnosciAdmin from "./AktualnosciAdmin";

export default async function AktualnosciPage() {
  if (!(await isAdmin())) redirect("/panel");
  return <AktualnosciAdmin />;
}

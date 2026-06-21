import { hasAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import KosztyPanel from "./KosztyPanel";

export const dynamic = "force-dynamic";

export default async function KosztyPage() {
  if (!(await hasAccess("koszty"))) redirect("/panel");
  return <KosztyPanel />;
}

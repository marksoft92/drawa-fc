import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import KosztyPanel from "./KosztyPanel";

export const dynamic = "force-dynamic";

export default async function KosztyPage() {
  if (!(await isAdmin())) redirect("/panel");
  return <KosztyPanel />;
}

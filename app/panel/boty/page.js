import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import BotyPanel from "./BotyPanel";

export const dynamic = "force-dynamic";

export default async function BotyPage() {
  if (!(await isAdmin())) redirect("/panel");
  return <BotyPanel />;
}

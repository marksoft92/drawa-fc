import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import AnalitykaPanel from "./AnalitykaPanel";

export const dynamic = "force-dynamic";

export default async function AnalitykaPage() {
  if (!(await isAdmin())) redirect("/panel");
  return <AnalitykaPanel />;
}

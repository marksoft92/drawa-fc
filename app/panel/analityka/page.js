import { hasAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import AnalitykaPanel from "./AnalitykaPanel";

export const dynamic = "force-dynamic";

export default async function AnalitykaPage() {
  if (!(await hasAccess("analityka"))) redirect("/panel");
  return <AnalitykaPanel />;
}

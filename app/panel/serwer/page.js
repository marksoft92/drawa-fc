import { hasAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import SerwerPanel from "./SerwerPanel";

export const dynamic = "force-dynamic";

export default async function SerwerPage() {
  if (!(await hasAccess("serwer"))) redirect("/panel");
  return <SerwerPanel />;
}

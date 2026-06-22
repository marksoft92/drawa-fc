import { hasAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import ZrodlaAdmin from "./ZrodlaAdmin";

export const dynamic = "force-dynamic";

export default async function ZrodlaPage() {
  if (!(await hasAccess("zrodla"))) redirect("/panel");
  return <ZrodlaAdmin />;
}

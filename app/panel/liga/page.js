import { hasAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import LigaAdmin from "./LigaAdmin";

export const dynamic = "force-dynamic";

export default async function LigaPage() {
  if (!(await hasAccess("liga"))) redirect("/panel");
  return <LigaAdmin />;
}

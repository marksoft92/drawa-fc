import { hasAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import StrukturaAdmin from "./StrukturaAdmin";

export const dynamic = "force-dynamic";

export default async function StrukturaPage() {
  if (!(await hasAccess("struktura"))) redirect("/panel");
  return <StrukturaAdmin />;
}

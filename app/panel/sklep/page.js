import { hasAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import SklepAdmin from "./SklepAdmin";

export const dynamic = "force-dynamic";

export default async function SklepPage() {
  if (!(await hasAccess("sklep"))) redirect("/panel");
  return <SklepAdmin />;
}

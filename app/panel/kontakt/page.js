import { hasAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import KontaktAdmin from "./KontaktAdmin";

export const dynamic = "force-dynamic";

export default async function KontaktPage() {
  if (!(await hasAccess("kontakt"))) redirect("/panel");
  return <KontaktAdmin />;
}

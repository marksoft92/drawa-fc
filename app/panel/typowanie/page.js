import { hasAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import TypowanieAdmin from "./TypowanieAdmin";

export const dynamic = "force-dynamic";

export default async function TypowaniePage() {
  if (!(await hasAccess("typowanie"))) redirect("/panel");
  return <TypowanieAdmin />;
}

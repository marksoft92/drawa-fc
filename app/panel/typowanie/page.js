import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import TypowanieAdmin from "./TypowanieAdmin";

export const dynamic = "force-dynamic";

export default async function TypowaniePage() {
  if (!(await isAdmin())) redirect("/panel");
  return <TypowanieAdmin />;
}

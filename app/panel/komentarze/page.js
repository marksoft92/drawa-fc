import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import KomentarzeAdmin from "./KomentarzeAdmin";

export const dynamic = "force-dynamic";

export default async function KomentarzePage() {
  if (!(await isAdmin())) redirect("/panel");
  return <KomentarzeAdmin />;
}

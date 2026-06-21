import { hasAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import KomentarzeAdmin from "./KomentarzeAdmin";

export const dynamic = "force-dynamic";

export default async function KomentarzePage() {
  if (!(await hasAccess("komentarze"))) redirect("/panel");
  return <KomentarzeAdmin />;
}

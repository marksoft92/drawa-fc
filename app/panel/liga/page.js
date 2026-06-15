import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import LigaAdmin from "./LigaAdmin";

export const dynamic = "force-dynamic";

export default async function LigaPage() {
  if (!(await isAdmin())) redirect("/panel");
  return <LigaAdmin />;
}

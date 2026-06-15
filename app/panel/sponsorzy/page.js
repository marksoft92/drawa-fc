import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import SponsorsAdmin from "./SponsorsAdmin";

export const dynamic = "force-dynamic";

export default async function SponsorsPage() {
  if (!(await isAdmin())) redirect("/panel");
  return <SponsorsAdmin />;
}

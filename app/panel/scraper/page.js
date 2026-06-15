import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import ScraperAdmin from "./ScraperAdmin";

export const dynamic = "force-dynamic";

export default async function ScraperPage() {
  if (!(await isAdmin())) redirect("/panel");
  return <ScraperAdmin />;
}

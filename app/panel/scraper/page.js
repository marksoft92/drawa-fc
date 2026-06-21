import { hasAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import ScraperAdmin from "./ScraperAdmin";

export const dynamic = "force-dynamic";

export default async function ScraperPage() {
  if (!(await hasAccess("scraper"))) redirect("/panel");
  return <ScraperAdmin />;
}

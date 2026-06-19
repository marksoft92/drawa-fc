import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewsletterPanel from "./NewsletterPanel";

export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  if (!(await isAdmin())) redirect("/panel");
  return <NewsletterPanel />;
}

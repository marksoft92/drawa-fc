import { hasAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import SezonClient from "./SezonClient";

export default async function SezonyPage() {
  if (!(await hasAccess("sezony"))) redirect("/panel");
  return <SezonClient />;
}

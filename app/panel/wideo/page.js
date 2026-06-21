import { hasAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import WideoAdmin from "./WideoAdmin";

export default async function WideoPage() {
  if (!(await hasAccess("wideo"))) redirect("/panel");
  return <WideoAdmin />;
}

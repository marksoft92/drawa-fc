import { hasAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import StronyAdmin from "./StronyAdmin";

export default async function StronyPage() {
  if (!(await hasAccess("strony"))) redirect("/panel");
  return <StronyAdmin />;
}

import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import StrukturaAdmin from "./StrukturaAdmin";

export const dynamic = "force-dynamic";

export default async function StrukturaPage() {
  if (!(await isAdmin())) redirect("/panel");
  return <StrukturaAdmin />;
}

import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import SezonClient from "./SezonClient";

export default async function SezonyPage() {
  if (!(await isAdmin())) redirect("/panel");
  return <SezonClient />;
}

import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import GaleriaAdmin from "./GaleriaAdmin";

export const dynamic = "force-dynamic";

export default async function GaleriaPage() {
  if (!(await isAdmin())) redirect("/panel");
  return <GaleriaAdmin />;
}

import { hasAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import GaleriaAdmin from "./GaleriaAdmin";

export const dynamic = "force-dynamic";

export default async function GaleriaPage() {
  if (!(await hasAccess("galeria"))) redirect("/panel");
  return <GaleriaAdmin />;
}

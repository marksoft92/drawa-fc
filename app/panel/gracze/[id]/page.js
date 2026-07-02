import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import HistoriaClient from "./HistoriaClient";

export default async function GraczHistoriaPage({ params }) {
  if (!(await isAdmin())) redirect("/panel/gracze");
  const { id } = await params;
  return <HistoriaClient userId={id} />;
}

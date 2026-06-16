import { getPlayerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import NowaAnkietaClient from "./NowaAnkietaClient";

export const metadata = { robots: { index: false } };

export default async function NowaAnkietaPage() {
  const session = await getPlayerSession();
  if (!session) redirect("/login?next=/panel/ankiety/nowa");

  const { role } = session.user;
  if (role !== "ADMIN" && role !== "STAFF") redirect("/panel/ankiety");

  return <NowaAnkietaClient />;
}

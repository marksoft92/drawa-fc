import { getPlayerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AnkietyClient from "./AnkietyClient";

export const metadata = { robots: { index: false } };

export default async function AnkietyPage() {
  const session = await getPlayerSession();
  if (!session) redirect("/login?next=/panel/ankiety");

  const { user } = session;
  const canCreate = user.role === "ADMIN" || user.role === "STAFF";

  return <AnkietyClient userId={user.id} role={user.role} canCreate={canCreate} />;
}

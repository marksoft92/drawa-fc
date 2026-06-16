import { getPlayerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AnkietaDetailClient from "./AnkietaDetailClient";

export const metadata = { robots: { index: false } };

export default async function AnkietaDetailPage({ params }) {
  const session = await getPlayerSession();
  if (!session) redirect("/login?next=/panel/ankiety");

  const { id } = await params;
  const canManage = session.user.role === "ADMIN" || session.user.role === "STAFF";

  return <AnkietaDetailClient ankietaId={id} userId={session.user.id} canManage={canManage} />;
}

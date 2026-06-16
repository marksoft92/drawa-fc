import { getPlayerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DMClient from "./DMClient";

export default async function DmPage({ params }) {
  const session = await getPlayerSession();
  if (!session) redirect("/login");
  const { userId } = await params;
  return <DMClient myId={session.user.id} otherId={userId} />;
}

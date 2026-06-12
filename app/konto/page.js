import { getPlayerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import KontoClient from "./KontoClient";

export default async function KontoPage() {
  const session = await getPlayerSession();
  if (!session) redirect("/login");
  const u = session.user;
  return (
    <KontoClient
      initialUser={{
        id: u.id,
        login: u.login,
        email: u.email,
        role: u.role,
        mustChangePassword: u.mustChangePassword,
        player: u.player ?? null,
      }}
    />
  );
}

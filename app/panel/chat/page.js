import { getPlayerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChatClient from "./ChatClient";

export const metadata = { robots: { index: false } };

export default async function ChatPage() {
  const session = await getPlayerSession();
  if (!session) redirect("/login?next=/panel/chat");

  const { user } = session;
  return (
    <ChatClient
      myId={user.id}
      myName={user.player?.imieNazwisko ?? user.login}
      isAdmin={user.role === "ADMIN"}
    />
  );
}

import { redirect } from "next/navigation";

export default function OldAdminRedirect() {
  redirect("/panel/transmisja");
}

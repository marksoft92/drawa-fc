import { isAdmin } from "@/lib/auth";

export async function GET() {
  return Response.json({ authed: await isAdmin() });
}

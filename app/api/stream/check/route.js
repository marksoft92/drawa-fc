import { hasAccess } from "@/lib/auth";

export async function GET() {
  return Response.json({ authed: await hasAccess("transmisja") });
}

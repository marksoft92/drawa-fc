import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";

  const where =
    status === "pending" ? { zatwierdzony: false } :
    status === "approved" ? { zatwierdzony: true } : {};

  const komentarze = await prisma.komentarz.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ komentarze });
}

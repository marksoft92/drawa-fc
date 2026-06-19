import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  const data = {};
  if (body.pozycja !== undefined) data.pozycja = Number(body.pozycja);
  if (body.nazwa !== undefined) data.nazwa = body.nazwa;
  if (body.pkt !== undefined) data.pkt = Number(body.pkt);
  if (body.mecze !== undefined) data.mecze = Number(body.mecze);
  if (body.wygrane !== undefined) data.wygrane = Number(body.wygrane);
  if (body.remisy !== undefined) data.remisy = Number(body.remisy);
  if (body.przegrane !== undefined) data.przegrane = Number(body.przegrane);
  if (body.bramkiZd !== undefined) data.bramkiZd = Number(body.bramkiZd);
  if (body.bramkiStr !== undefined) data.bramkiStr = Number(body.bramkiStr);
  if (body.forma !== undefined) data.forma = body.forma;

  const row = await prisma.tabelaDruzyna.update({ where: { id }, data });
  return Response.json(row);
}

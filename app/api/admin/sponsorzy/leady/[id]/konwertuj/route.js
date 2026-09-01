import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function slugify(str) {
  return str.toLowerCase()
    .replace(/ą/g,"a").replace(/ć/g,"c").replace(/ę/g,"e").replace(/ł/g,"l")
    .replace(/ń/g,"n").replace(/ó/g,"o").replace(/ś/g,"s").replace(/ź/g,"z").replace(/ż/g,"z")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Zamienia zaakceptowany lead w publicznego sponsora (widocznego na /wspolpraca).
export async function POST(request, { params }) {
  if (!(await hasAccess("sponsorzy"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });
  const { id } = await params;

  const lead = await prisma.sponsorLead.findUnique({ where: { id } });
  if (!lead) return Response.json({ error: "Nie znaleziono leada" }, { status: 404 });
  if (lead.sponsorId) return Response.json({ error: "Ten lead już ma przypisanego sponsora" }, { status: 400 });

  const baseSlug = slugify(lead.nazwa);
  const existing = await prisma.sponsor.findMany({ where: { slug: { startsWith: baseSlug } }, select: { slug: true } });
  const taken = new Set(existing.map(s => s.slug));
  let slug = baseSlug;
  let n = 2;
  while (taken.has(slug)) slug = `${baseSlug}-${n++}`;

  const sponsor = await prisma.sponsor.create({
    data: {
      nazwa: lead.nazwa,
      slug,
      href: lead.www || null,
      aktywny: false, // klub uzupełnia logo/opis przed publikacją
    },
  });

  await prisma.sponsorLead.update({
    where: { id },
    data: { status: "PODPISANE", sponsorId: sponsor.id },
  });

  return Response.json({ sponsor }, { status: 201 });
}

import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FREE_MODELS = [
  "stealth/ox-alpha",
  "openai/gpt-oss-120b",
  "qwen/qwen3-next-80b-a3b-instruct",
  "nousresearch/hermes-3-405b-instruct",
  "meta-llama/llama-3.3-70b-instruct",
  "nvidia/nemotron-3-nano-30b-a3b",
  "openai/gpt-oss-20b",
];

const SYSTEM_PROMPT = `Jesteś redaktorem portalu piłkarskiego z zachodniopomorskiego. Dostajesz surowy post z Facebooka klubu piłkarskiego i musisz go przepisać na pełny artykuł dziennikarski.

ZASADY:
- Pisz w 3. osobie (np. "Klub X poinformował", "Drużyna rozegrała")
- Rozbuduj treść do kilku akapitów (minimum 3-4)
- Dodaj kontekst sportowy jeśli to możliwe
- Zachowaj WSZYSTKIE fakty z oryginału (wyniki, nazwiska, daty, godziny)
- Nie wymyślaj faktów których nie ma w oryginale
- Usuń emoji, hashtagi, tagi sponsorów
- Ton: rzeczowy, dziennikarski, ale przyjazny
- Nie dodawaj na końcu podsumowań typu "Będziemy śledzić losy..."

ODPOWIEDZ DOKŁADNIE W TYM FORMACIE (bez żadnych dodatkowych komentarzy):
TYTUŁ: [tytuł artykułu]
TAGI: [2-4 tagi oddzielone przecinkami, np: transfery, wyniki, zapowiedź, B klasa]
---
[treść artykułu]`;

async function callOpenRouter(model, klubNazwa, tresc) {
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://drawa-fc.pl",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Klub: ${klubNazwa}\n\nOryginalny post z Facebooka:\n${tresc}` },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!r.ok) {
    const err = await r.text().catch(() => "");
    throw new Error(`${model}: HTTP ${r.status} ${err.slice(0, 200)}`);
  }

  const data = await r.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${model}: pusta odpowiedź`);
  return { content, model };
}

function parseResponse(raw) {
  const lines = raw.trim().split("\n");
  let tytul = "";
  let tags = [];
  let tresc = "";
  let separatorIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("TYTUŁ:")) {
      tytul = lines[i].replace("TYTUŁ:", "").trim();
    }
    if (lines[i].startsWith("TAGI:")) {
      tags = lines[i].replace("TAGI:", "").split(",").map(t => t.trim()).filter(Boolean);
    }
    if (lines[i].trim() === "---") {
      separatorIdx = i;
      break;
    }
  }

  if (separatorIdx >= 0) {
    tresc = lines.slice(separatorIdx + 1).join("\n").trim();
  } else if (tytul) {
    const rest = lines.filter(l => !l.startsWith("TYTUŁ:") && !l.startsWith("TAGI:")).join("\n").trim();
    tresc = rest;
  } else {
    const firstLine = lines[0]?.replace(/^#+\s*/, "").trim() || "";
    tytul = firstLine;
    tresc = lines.slice(1).join("\n").trim();
  }

  tytul = tytul.replace(/^["„]+|["„]+$/g, "").replace(/^#+\s*/, "").trim();

  return { tytul, tags, tresc };
}

export async function POST(request, { params }) {
  if (!(await hasAccess("zrodla"))) return Response.json({ error: "Brak dostępu" }, { status: 401 });

  const { id } = await params;
  const wpis = await prisma.wpisLigowy.findUnique({
    where: { id },
    include: { zrodlo: { select: { nazwa: true } } },
  });

  if (!wpis) return Response.json({ error: "Nie znaleziono wpisu" }, { status: 404 });

  const errors = [];

  for (const model of FREE_MODELS) {
    try {
      const { content, model: usedModel } = await callOpenRouter(model, wpis.zrodlo.nazwa, wpis.tresc);
      const parsed = parseResponse(content);

      if (!parsed.tytul || !parsed.tresc || parsed.tresc.length < 100) {
        errors.push(`${model}: za krótka odpowiedź`);
        continue;
      }

      return Response.json({
        tytul: parsed.tytul,
        tags: parsed.tags,
        tresc: parsed.tresc,
        model: usedModel,
        raw: content,
      });
    } catch (e) {
      errors.push(e.message);
    }
  }

  return Response.json(
    { error: "Wszystkie modele zawiodły", details: errors },
    { status: 502 }
  );
}

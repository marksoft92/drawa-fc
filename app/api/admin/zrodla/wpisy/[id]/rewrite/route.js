import { hasAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Tylko modele zweryfikowane jako wciąż dostępne w darmowym tierze OpenRouter
// (wiele popularnych :free slugów zostało wycofanych — sprawdzaj okresowo).
const FREE_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "liquid/lfm-2.5-2.6b:free",
  "dots-studio/dots-3-note-preview:free",
  "poolside/laguna-s-2.1:free",
  "poolside/laguna-xs-2.1:free",
];

// Gdy jeden klucz wyczerpie dzienny limit darmowych zapytań, próbujemy kolejny.
const OPENROUTER_KEYS = [process.env.OPENROUTER_API_KEY, process.env.OPENROUTER_API_KEY_2].filter(Boolean);

const SYSTEM_PROMPT = `Jesteś doświadczonym dziennikarzem sportowym lokalnego portalu piłkarskiego z zachodniopomorskiego. Dostajesz surowy post z Facebooka klubu i przepisujesz go na artykuł, jak do gazety sportowej — nie na urzędowy komunikat klubowy.

PRAWDA PRZEDE WSZYSTKIM:
- Opisuj wyłącznie fakty z oryginału: wynik, strzelcy, minuty, nazwiska, daty, godziny, miejsca.
- Nie zmyślaj przebiegu meczu, cytatów, nastrojów kibiców ani szczegółów, których nie ma w źródle.
- Kontekst sportowy (np. znaczenie wyniku, seria meczów, sytuacja w tabeli) dodawaj tylko, jeśli wynika wprost z posta — inaczej pomiń, zamiast zgadywać.
- Krótki, ubogi w fakty post = krótszy artykuł. Nie "dopychaj" objętości ogólnikami tylko po to, by wyjść na kilka akapitów.

RÓŻNORODNOŚĆ (kluczowe — czytelnik widzi te artykuły jeden po drugim, nie mogą brzmieć jak kalka):
- Za każdym razem zacznij inaczej: raz od wyniku, raz od kluczowego momentu meczu, raz od konkretnego zdarzenia (gol, kontuzja, decyzja sędziego), raz od rangi spotkania. "Klub X poinformował, że…" to jedna z wielu możliwych opcji, nie domyślny szablon — nie zaczynaj tak za każdym razem.
- Różnicuj rytm i długość zdań, nie klep każdego akapitu tym samym schematem podmiot-orzeczenie-wynik.
- Dopasuj formę do typu wiadomości: relacja z meczu ma inną strukturę niż zapowiedź, a inną niż krótki komunikat klubowy (transfer, podziękowanie, ogłoszenie) — nie każdy news potrzebuje rozbudowanego kontekstu i tej samej liczby akapitów.
- Unikaj sztampowych zwrotów dziennikarskich ("warto dodać", "nie da się ukryć", "trzeba przyznać") — jeśli któryś się przyda, nie powtarzaj go w każdym tekście.

STYL:
- 3. osoba, ton rzeczowy, ale żywy — jak lokalny dziennikarz, nie biuro prasowe klubu.
- Usuń emoji, hashtagi, oznaczenia sponsorów, wezwania do polubienia/udostępnienia.
- Zakończenie ma nieść konkretną informację (np. termin kolejnego meczu) albo po prostu kończyć relację — bez banałów typu "Będziemy śledzić losy...".

ODPOWIEDZ DOKŁADNIE W TYM FORMACIE (bez żadnych dodatkowych komentarzy):
TYTUŁ: [tytuł artykułu]
TAGI: [2-4 tagi oddzielone przecinkami, np: transfery, wyniki, zapowiedź, B klasa]
---
[treść artykułu]`;

async function callOpenRouter(model, klubNazwa, tresc, apiKey) {
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
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
      temperature: 0.9,
      frequency_penalty: 0.5,
      presence_penalty: 0.3,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!r.ok) {
    const errText = await r.text().catch(() => "");
    let isDailyLimit = false;
    try { isDailyLimit = r.status === 429 && /free-models-per-day/.test(JSON.parse(errText)?.error?.message || ""); } catch {}
    const err = new Error(`${model}: HTTP ${r.status} ${errText.slice(0, 200)}`);
    err.isDailyLimit = isDailyLimit;
    throw err;
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

  if (OPENROUTER_KEYS.length === 0) {
    return Response.json({ error: "Brak OPENROUTER_API_KEY" }, { status: 500 });
  }

  const errors = [];
  const exhaustedKeys = new Set();

  for (const model of FREE_MODELS) {
    for (const key of OPENROUTER_KEYS) {
      if (exhaustedKeys.has(key)) continue;
      try {
        const { content, model: usedModel } = await callOpenRouter(model, wpis.zrodlo.nazwa, wpis.tresc, key);
        const parsed = parseResponse(content);

        if (!parsed.tytul || !parsed.tresc || parsed.tresc.length < 100) {
          errors.push(`${model}: za krótka odpowiedź`);
          break;
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
        if (e.isDailyLimit) exhaustedKeys.add(key);
        else break;
      }
    }
  }

  return Response.json(
    { error: "Wszystkie modele zawiodły", details: errors },
    { status: 502 }
  );
}

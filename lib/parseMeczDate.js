const MONTHS = {
  sty: 0, styczeń: 0,
  lut: 1, luty: 1,
  mar: 2, marzec: 2,
  kwi: 3, kwiecień: 3,
  maj: 4,
  cze: 5, czerwiec: 5,
  lip: 6, lipiec: 6,
  sie: 7, sierpień: 7,
  wrz: 8, wrzesień: 8,
  "paź": 9, październik: 9,
  lis: 10, listopad: 10,
  gru: 11, grudzień: 11,
};

// Terminarz z regiowyniki.pl podaje daty bez roku (np. "22 sie", "05 wrz 14:00").
// Sezon piłkarski trwa lipiec–czerwiec, więc rok trzeba dobrać względem
// dzisiejszej daty, a nie na sztywno — inaczej psuje się przy zmianie sezonu.
function guessYear(month, now = new Date()) {
  const nowMonth = now.getMonth();
  const nowYear = now.getFullYear();
  if (month >= 6) return nowMonth >= 6 ? nowYear : nowYear - 1;
  return nowMonth < 6 ? nowYear : nowYear + 1;
}

/** Parsuje polski string daty meczu (np. "22 sie", "5 września 2026, 14:00") na Date, albo null. */
export function parseMeczDate(str, now = new Date()) {
  if (!str) return null;
  const cleaned = str.replace(",", "").toLowerCase();
  const tokens = cleaned.split(/\s+/);

  let day = null, month = null, year = null, hours = 0, minutes = 0;

  for (const token of tokens) {
    if (/^\d{1,2}:\d{2}$/.test(token)) {
      const [h, m] = token.split(":").map(Number);
      hours = h; minutes = m;
      continue;
    }
    if (/^\d{4}$/.test(token)) { year = parseInt(token, 10); continue; }
    if (/^\d{1,2}$/.test(token)) { day = parseInt(token, 10); continue; }
    const matchedKey = Object.keys(MONTHS).find((k) => token.startsWith(k));
    if (matchedKey !== undefined) month = MONTHS[matchedKey];
  }

  if (day === null || month === null) return null;
  if (year === null) year = guessYear(month, now);

  return new Date(year, month, day, hours, minutes, 0, 0);
}

/** Klucz sortowania rosnąco (najbliższe/najstarsze first) — braki dat lądują na końcu. */
export function meczSortKeyAsc(str) {
  const d = parseMeczDate(str);
  return d ? d.getTime() : Infinity;
}

/**
 * Czy mecz kwalifikuje się jako "nadchodzący". Scraper czasem zostawia
 * stary rekord bez wyniku (np. duplikat sprzed aktualizacji terminarza) —
 * taki mecz ma datę w przeszłości mimo braku score/walkowera, więc same
 * pola score/walkower nie wystarczą, trzeba doliczyć porównanie z dzisiejszą datą.
 */
export function isMeczUpcoming(mecz, now = new Date()) {
  if (!mecz || mecz.score || mecz.walkower) return false;
  const d = parseMeczDate(mecz.date, now);
  if (!d) return true;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d.getTime() >= startOfToday.getTime();
}

/** Klucz sortowania malejąco (najnowsze first) — braki dat lądują na końcu. */
export function meczSortKeyDesc(str) {
  const d = parseMeczDate(str);
  return d ? d.getTime() : -Infinity;
}

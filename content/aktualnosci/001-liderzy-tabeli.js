// ──────────────────────────────────────────────
//  Jak dodać nową aktualność:
//  1. Skopiuj ten plik, zmień nazwę (np. 004-nowy-artykul.js)
//  2. Wypełnij pola poniżej
//  3. Dodaj import + wpis w content/aktualnosci/index.js
//  4. Zdjęcia wrzuć do /public/aktualnosci/001/ i podaj ścieżkę
// ──────────────────────────────────────────────

const artykul = {
  id: 1,
  slug: 'liderzy-tabeli-drawa-dominuje',
  title: 'Liderzy tabeli! Drawa dominuje klasę B',
  date: '2026-05-25',

  // Tagi wyświetlane na karcie i w artykule
  tags: ['wynik', 'liga', 'lider'],

  // Kolor akcentu karty (opcjonalnie)
  kolor: '#22c55e',

  // Ścieżka do zdjęcia miniaturki (null = placeholder)
  thumbnail: '/logo.png',
  excerpt:
    'MKS Drawa Drawno utrzymuje pozycję lidera z 46 punktami po 19 meczach. Drużyna jest w rewelacyjnej formie sezonu 2025/26!',

  // Pełna treść artykułu (akapity oddzielone \n\n)
  content: `Nasz klub po 19 kolejkach sezonu 2025/26 utrzymuje pozycję lidera tabeli Klasy B Zachodniopomorskiej z dorobkiem 46 punktów.

Drawa Drawno rozegrała dotychczas 19 meczów, wygrywając 14, remisując 4 i przegrywając tylko raz. Bilans bramkowy 76:28 świadczy o fantastycznej dyspozycji naszych zawodników.

Wynik jest efektem ciężkiej pracy wszystkich — zawodników, trenerów i całego sztabu. Dziękujemy kibicom za nieustające wsparcie na każdym meczu domowym i wyjazdowym.

Najbliższe spotkanie rozegramy już w przyszłą sobotę. Zapraszamy wszystkich kibiców na stadion przy ul. Kościuszki 3!`,

  // Zdjęcia w artykule (minimum 3), src: null = placeholder aż do dodania pliku
  photos: [
    { src: '/logo.png', caption: '' },
  ],
};



export default artykul;

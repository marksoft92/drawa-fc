const SITE = "https://mksdrawadrawno.pl";

/** Zwraca pełny URL — panel czasem zapisuje już pełny link (np. wklejony z CopyUrlBar),
 * a czasem samą ścieżkę względną z uploadu, więc trzeba to rozróżnić zamiast zawsze doklejać domenę. */
export function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${SITE}${pathOrUrl}`;
}

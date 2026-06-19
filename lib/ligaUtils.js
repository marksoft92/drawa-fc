export function groupByKolejka(mecze) {
  const ligowe = mecze.filter(m => !m.liga?.toLowerCase().includes('puchar'));

  return ligowe.map((m, i) => ({
    nr: i + 1,
    date: m.date || '?',
    mecze: [m],
  }));
}

export function isDrawa(name) {
  return name?.toLowerCase().includes('drawa drawno');
}

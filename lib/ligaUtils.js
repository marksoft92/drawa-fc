export function groupByKolejka(mecze) {
  const dominated = mecze.filter(m => !m.walkower && m.score);
  const walkowers = mecze.filter(m => m.walkower);

  const dateGroups = new Map();
  for (const m of dominated) {
    const dateKey = m.date?.split(',')[0]?.trim() || m.date || '?';
    if (!dateGroups.has(dateKey)) dateGroups.set(dateKey, []);
    dateGroups.get(dateKey).push(m);
  }

  const kolejki = [];
  let nr = 1;
  for (const [date, matches] of dateGroups) {
    if (matches.length >= 2) {
      kolejki.push({ nr, date, mecze: matches });
      nr++;
    }
  }

  if (walkowers.length > 0) {
    kolejki.push({ nr: 0, date: 'Walkowery', mecze: walkowers });
  }

  for (const m of dominated) {
    const dateKey = m.date?.split(',')[0]?.trim() || m.date || '?';
    const group = dateGroups.get(dateKey);
    if (group && group.length < 2) {
      const existing = kolejki.find(k => k.mecze.some(km => km.date === m.date));
      if (!existing) {
        kolejki.push({ nr, date: dateKey, mecze: [m] });
        nr++;
      }
    }
  }

  return kolejki.filter(k => k.nr > 0).sort((a, b) => a.nr - b.nr);
}

export function slugifySezon(sezon) {
  return sezon.replace(/\//g, '-');
}

export function isDrawa(name) {
  return name?.toLowerCase().includes('drawa drawno');
}

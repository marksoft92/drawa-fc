// Kody typów z Health Connect (ExerciseSessionRecord.exerciseType)
const EXERCISE_TYPE_LABELS = {
  0: "Trening (inny)",
  8: "Rower",
  57: "Bieganie",
  65: "Piłka nożna",
  70: "Siłownia",
  79: "Marsz",
  81: "Podnoszenie ciężarów",
};

export function exerciseLabel(type) {
  return EXERCISE_TYPE_LABELS[type] ?? `Trening (typ ${type})`;
}

export function formatExerciseWhen(startTime) {
  const d = new Date(startTime);
  const dateStr = d.toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw", day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = d.toLocaleTimeString("pl-PL", { timeZone: "Europe/Warsaw", hour: "2-digit", minute: "2-digit" });
  return `${dateStr}, ${timeStr}`;
}

export function formatDuration(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} godz. ${mins % 60} min`;
}

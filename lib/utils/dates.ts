/** Date de référence utilisée dans toute l'application de démonstration (mardi 9 septembre 2026). */
export function getReferenceToday(): Date {
  return new Date(2026, 8, 9);
}

export function getDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start, end };
}

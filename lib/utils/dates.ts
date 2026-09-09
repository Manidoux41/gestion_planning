/** Date du jour réelle, utilisée comme référence "aujourd'hui" dans toute l'application. */
export function getReferenceToday(): Date {
  return new Date();
}

export function getDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start, end };
}

/** Formate une date locale en yyyy-mm-dd, sans décalage de fuseau horaire (contrairement à toISOString). */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Calcule une durée lisible ("1h30", "45min") entre deux heures au format HH:mm. */
export function formatDuration(start: string, end: string): string {
  if (!start || !end) return "";
  const [startHour = 0, startMinute = 0] = start.split(":").map(Number);
  const [endHour = 0, endMinute = 0] = end.split(":").map(Number);
  const minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  if (minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours > 0 ? `${hours}h${remaining ? String(remaining).padStart(2, "0") : ""}` : `${remaining}min`;
}

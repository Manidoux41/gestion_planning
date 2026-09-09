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

/** Bornes du mois calendaire contenant la date fournie (fin exclusive, 1er du mois suivant). */
export function getMonthBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

/** Bornes de la semaine (lundi 00:00 à lundi suivant 00:00) contenant la date fournie. */
export function getWeekBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

/** Formate une date locale en yyyy-mm-dd, sans décalage de fuseau horaire (contrairement à toISOString). */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Formate une date locale en yyyy-mm-ddTHH:mm pour préremplir un input datetime-local. */
export function toIsoDateTimeLocal(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${toIsoDate(date)}T${hours}:${minutes}`;
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

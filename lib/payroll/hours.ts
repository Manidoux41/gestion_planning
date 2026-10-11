import { toIsoDate } from "@/lib/utils/dates";

export type WorkedEntry = {
  workDate: Date;
  arrivalAt: Date | null;
  departureAt: Date | null;
  breaks: { startsAt: Date; endsAt: Date | null }[];
};

export type WorkedHoursByDay = { date: Date; hours: number };

function getWorkedMinutes(entry: WorkedEntry, periodStart: Date, periodEnd: Date): number {
  if (!entry.arrivalAt || !entry.departureAt) return 0;
  const start = entry.arrivalAt < periodStart ? periodStart : entry.arrivalAt;
  const end = entry.departureAt > periodEnd ? periodEnd : entry.departureAt;
  if (end <= start) return 0;

  let minutes = (end.getTime() - start.getTime()) / 60_000;
  for (const brk of entry.breaks) {
    if (!brk.endsAt) continue;
    const breakStart = brk.startsAt < start ? start : brk.startsAt;
    const breakEnd = brk.endsAt > end ? end : brk.endsAt;
    if (breakEnd > breakStart) minutes -= (breakEnd.getTime() - breakStart.getTime()) / 60_000;
  }
  return Math.max(minutes, 0);
}

/**
 * Additionne les heures réellement travaillées à partir de pointages validés,
 * en tronquant chaque pointage à la période fournie (ex. après le début du contrat) et en retirant les pauses.
 */
export function computeWorkedHours(entries: WorkedEntry[], periodStart: Date, periodEnd: Date): number {
  return entries.reduce((total, entry) => total + getWorkedMinutes(entry, periodStart, periodEnd), 0) / 60;
}

export function computeWorkedHoursByDay(entries: WorkedEntry[], periodStart: Date, periodEnd: Date): WorkedHoursByDay[] {
  const dailyMinutes = new Map<string, number>();
  const dates = new Map<string, Date>();

  for (const entry of entries) {
    const minutes = getWorkedMinutes(entry, periodStart, periodEnd);
    if (minutes === 0) continue;
    const key = toIsoDate(entry.workDate);
    dailyMinutes.set(key, (dailyMinutes.get(key) ?? 0) + minutes);
    if (!dates.has(key)) {
      dates.set(key, new Date(entry.workDate.getFullYear(), entry.workDate.getMonth(), entry.workDate.getDate()));
    }
  }

  return [...dailyMinutes.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, minutes]) => ({ date: dates.get(key)!, hours: minutes / 60 }));
}

/** Proratise les heures prévues (contrat hebdomadaire) sur la portion réelle de la période couverte. */
export function computeProratedPlannedHours(weeklyHours: number, periodStart: Date, periodEnd: Date): number {
  const days = Math.max(0, (periodEnd.getTime() - periodStart.getTime()) / 86_400_000);
  return (weeklyHours / 7) * days;
}

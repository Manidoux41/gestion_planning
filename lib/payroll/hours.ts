export type WorkedEntry = { arrivalAt: Date | null; departureAt: Date | null; breaks: { startsAt: Date; endsAt: Date | null }[] };

/**
 * Additionne les heures réellement travaillées à partir de pointages validés,
 * en tronquant chaque pointage à la période fournie (ex. après le début du contrat) et en retirant les pauses.
 */
export function computeWorkedHours(entries: WorkedEntry[], periodStart: Date, periodEnd: Date): number {
  let totalMinutes = 0;
  for (const entry of entries) {
    if (!entry.arrivalAt || !entry.departureAt) continue;
    const start = entry.arrivalAt < periodStart ? periodStart : entry.arrivalAt;
    const end = entry.departureAt > periodEnd ? periodEnd : entry.departureAt;
    if (end <= start) continue;
    let minutes = (end.getTime() - start.getTime()) / 60_000;
    for (const brk of entry.breaks) {
      if (!brk.endsAt) continue;
      const breakStart = brk.startsAt < start ? start : brk.startsAt;
      const breakEnd = brk.endsAt > end ? end : brk.endsAt;
      if (breakEnd > breakStart) minutes -= (breakEnd.getTime() - breakStart.getTime()) / 60_000;
    }
    totalMinutes += Math.max(minutes, 0);
  }
  return totalMinutes / 60;
}

/** Proratise les heures prévues (contrat hebdomadaire) sur la portion réelle de la période couverte. */
export function computeProratedPlannedHours(weeklyHours: number, periodStart: Date, periodEnd: Date): number {
  const days = Math.max(0, (periodEnd.getTime() - periodStart.getTime()) / 86_400_000);
  return (weeklyHours / 7) * days;
}

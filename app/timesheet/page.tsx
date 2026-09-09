import { Check, Clock3, LogIn } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ClockButtons } from "@/components/timesheet/clock-buttons";
import { ExportTimesheetButton } from "@/components/timesheet/export-timesheet-button";
import { requireUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { translator } from "@/lib/i18n";
import { computeProratedPlannedHours, computeWorkedHours } from "@/lib/payroll";
import { getDayRange, getMonthBounds, getReferenceToday, getWeekBounds } from "@/lib/utils/dates";
import { validateTimeEntryAction } from "@/app/actions/timesheet";
import type { TimeEntry as TimeEntryRow, TimeEntryStatus } from "@/lib/db/domain-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const dayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "2-digit", month: "short" });
const timeFormatter = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

function formatHours(hours: number) {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h ${String(minutes).padStart(2, "0")}`;
}

export default async function TimesheetPage() {
  const user = await requireUser();
  const t = translator(user.language);
  const isAdmin = user.role !== "NANNY";
  const today = getReferenceToday();
  const { start: todayStart } = getDayRange(today);
  const { start: weekStart, end: weekEnd } = getWeekBounds(today);
  const { start: monthStart, end: monthEnd } = getMonthBounds(today);

  const nannies = isAdmin
    ? await prisma.nanny.findMany({ where: { familyId: user.familyId }, orderBy: { createdAt: "asc" } })
    : (user.nannyId ? await prisma.nanny.findMany({ where: { id: user.nannyId } }) : []);

  const nannyIds = nannies.map((nanny) => nanny.id);

  const [monthEntries, todaysOwnEntry] = await Promise.all([
    nannyIds.length ? prisma.timeEntry.findMany({ where: { familyId: user.familyId, nannyId: { in: nannyIds }, workDate: { gte: monthStart, lt: monthEnd } }, include: { breaks: true }, orderBy: { workDate: "desc" } }) : Promise.resolve([]),
    user.nannyId ? prisma.timeEntry.findUnique({ where: { nannyId_workDate: { nannyId: user.nannyId, workDate: todayStart } } }) : Promise.resolve(null),
  ]);

  const validatedEntries = monthEntries.filter((entry) => entry.status === "VALIDATED");
  const weekHours = computeWorkedHours(validatedEntries, weekStart, weekEnd);
  const monthHours = computeWorkedHours(validatedEntries, monthStart, monthEnd);
  const contractStart = nannies[0]?.startDate && nannies[0].startDate > monthStart ? nannies[0].startDate : monthStart;
  const plannedHours = nannies[0] ? computeProratedPlannedHours(nannies[0].weeklyHours, contractStart, monthEnd) : 0;

  const clockState = !todaysOwnEntry || !todaysOwnEntry.arrivalAt ? "not-started" : !todaysOwnEntry.departureAt ? "clocked-in" : "clocked-out";
  const arrivalLabel = todaysOwnEntry?.arrivalAt ? timeFormatter.format(todaysOwnEntry.arrivalAt) : "";

  const rows: (TimeEntryRow & { canValidate: boolean })[] = monthEntries.map((entry) => {
    const status: TimeEntryStatus = !entry.departureAt ? "En cours" : entry.status === "VALIDATED" ? "Validée" : "En attente";
    const duration = entry.arrivalAt && entry.departureAt ? formatHours(computeWorkedHours([entry], entry.arrivalAt, entry.departureAt)) : "—";
    return {
      id: entry.id,
      date: entry.workDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      day: dayFormatter.format(entry.workDate).split(" ")[0] ?? "",
      arrival: entry.arrivalAt ? timeFormatter.format(entry.arrivalAt) : "—",
      departure: entry.departureAt ? timeFormatter.format(entry.departureAt) : "—",
      duration,
      status,
      canValidate: isAdmin && status === "En attente",
    };
  });

  return <AppShell activePath="/timesheet" user={user}><div className="content-wrap app-page"><div className="page-heading"><div><p className="eyebrow">Suivi du temps</p><h1>{t("timesheet.title")}</h1><p className="page-subtitle">{t("timesheet.subtitle")}</p></div><ExportTimesheetButton entries={rows} /></div>

    {!isAdmin && <section className="clock-panel"><div><p className="eyebrow">Aujourd&apos;hui · {dayFormatter.format(today)}</p><h2>{clockState === "clocked-in" ? "La journée est en cours" : clockState === "clocked-out" ? "Journée terminée" : "Prête à commencer ?"}</h2>{clockState !== "not-started" && <p>Arrivée pointée à {arrivalLabel}.</p>}</div><ClockButtons state={clockState} arrivalLabel={arrivalLabel} /></section>}

    <div className="quick-stats"><div><Clock3 size={18} /><span>Cette semaine</span><strong>{formatHours(weekHours)}</strong></div><div><Check size={18} /><span>Ce mois</span><strong>{formatHours(monthHours)}</strong></div><div><LogIn size={18} /><span>Heures prévues</span><strong>{formatHours(plannedHours)}</strong></div></div>

    <section className="table-card"><div className="card-heading"><div><p className="eyebrow">Ce mois-ci</p><h2>Historique des pointages</h2></div></div><div className="time-table">{rows.length === 0 && <p className="page-subtitle">Aucun pointage ce mois-ci.</p>}{rows.map((entry) => <div className="time-row" key={entry.id}><div><b>{entry.day}</b><small>{entry.date}</small></div><span>{entry.arrival}</span><span>{entry.departure}</span><strong>{entry.duration}</strong><em className={entry.status === "En cours" ? "current" : ""}>{entry.status}</em>{entry.canValidate && <form action={validateTimeEntryAction.bind(null, entry.id)}><button type="submit" className="more-button" aria-label="Valider ce pointage"><Check size={16} color="#4e7b68" /></button></form>}</div>)}</div></section>
  </div></AppShell>;
}

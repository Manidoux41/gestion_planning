import { Check, Clock3, LogIn, Trash2, Undo2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ClockButtons } from "@/components/timesheet/clock-buttons";
import { EditTimeEntryForm } from "@/components/timesheet/edit-time-entry-form";
import { ExportTimesheetButton } from "@/components/timesheet/export-timesheet-button";
import { ManualTimeEntryForm } from "@/components/timesheet/manual-entry-form";
import { requireUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { translator } from "@/lib/i18n";
import { computeProratedPlannedHours, computeWorkedHours } from "@/lib/payroll";
import { getDayRange, getMonthBounds, getReferenceToday, getWeekBounds, toIsoDate } from "@/lib/utils/dates";
import { deleteTimeEntryAction, unvalidateTimeEntryAction, validateTimeEntryAction } from "@/app/actions/timesheet";
import type { TimeEntry as TimeEntryRow, TimeEntryStatus } from "@/lib/db/domain-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const dayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "2-digit", month: "short" });
const timeFormatter = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

function periodLabel(period: "MORNING" | "AFTERNOON") {
  return period === "MORNING" ? "Matin" : "Après-midi";
}

function timeInputValue(date: Date | null) {
  return date ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}` : "";
}

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
    user.nannyId ? prisma.timeEntry.findMany({ where: { nannyId: user.nannyId, workDate: todayStart } }) : Promise.resolve([]),
  ]);

  const validatedEntries = monthEntries.filter((entry) => entry.status === "VALIDATED");
  const weekHours = computeWorkedHours(validatedEntries, weekStart, weekEnd);
  const monthHours = computeWorkedHours(validatedEntries, monthStart, monthEnd);
  const contractStart = nannies[0]?.startDate && nannies[0].startDate > monthStart ? nannies[0].startDate : monthStart;
  const plannedHours = nannies[0] ? computeProratedPlannedHours(nannies[0].weeklyHours, contractStart, monthEnd) : 0;

  const morningEntry = todaysOwnEntry.find((entry) => entry.period === "MORNING");
  const afternoonEntry = todaysOwnEntry.find((entry) => entry.period === "AFTERNOON");
  const clockState = !morningEntry?.arrivalAt ? "not-started" : !morningEntry.departureAt ? "morning-in" : !afternoonEntry?.arrivalAt ? "morning-done" : !afternoonEntry.departureAt ? "afternoon-in" : "day-done";
  const arrivalLabel = morningEntry?.arrivalAt ? timeFormatter.format(morningEntry.arrivalAt) : "";

  const nannyNamesById = new Map(nannies.map((nanny) => [nanny.id, `${nanny.firstName} ${nanny.lastName}`]));

  const rows: (TimeEntryRow & { canValidate: boolean; canManage: boolean; nannyName: string; isoDate: string; periodValue: "MORNING" | "AFTERNOON"; arrival24: string; departure24: string })[] = monthEntries.map((entry) => {
    const status: TimeEntryStatus = !entry.departureAt ? "En cours" : entry.status === "VALIDATED" ? "Validée" : "En attente";
    const duration = entry.arrivalAt && entry.departureAt ? formatHours(computeWorkedHours([entry], entry.arrivalAt, entry.departureAt)) : "—";
    return {
      id: entry.id,
      date: entry.workDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      day: dayFormatter.format(entry.workDate).split(" ")[0] ?? "",
      period: periodLabel(entry.period),
      arrival: entry.arrivalAt ? timeFormatter.format(entry.arrivalAt) : "—",
      departure: entry.departureAt ? timeFormatter.format(entry.departureAt) : "—",
      duration,
      status,
      canValidate: isAdmin && status === "En attente",
      canManage: isAdmin && (status === "Validée" || status === "En attente"),
      nannyName: nannyNamesById.get(entry.nannyId) ?? "",
      isoDate: toIsoDate(entry.workDate),
      periodValue: entry.period,
      arrival24: timeInputValue(entry.arrivalAt),
      departure24: timeInputValue(entry.departureAt),
    };
  });

  return <AppShell activePath="/timesheet" user={user}><div className="content-wrap app-page"><div className="page-heading"><div><p className="eyebrow">Suivi du temps</p><h1>{t("timesheet.title")}</h1><p className="page-subtitle">{t("timesheet.subtitle")}</p></div><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{isAdmin && <ManualTimeEntryForm nannies={nannies.map((nanny) => ({ id: nanny.id, name: `${nanny.firstName} ${nanny.lastName}` }))} />}<ExportTimesheetButton entries={rows} /></div></div>

    {!isAdmin && <section className="clock-panel"><div><p className="eyebrow">Aujourd&apos;hui · {dayFormatter.format(today)}</p><h2>{clockState === "morning-in" ? "Matinée en cours" : clockState === "morning-done" ? "Pause du midi" : clockState === "afternoon-in" ? "Après-midi en cours" : clockState === "day-done" ? "Journée terminée" : "Prête à commencer ?"}</h2>{clockState !== "not-started" && <p>Arrivée du matin pointée à {arrivalLabel}.</p>}</div><ClockButtons state={clockState} arrivalLabel={arrivalLabel} /></section>}

    <div className="quick-stats"><div><Clock3 size={18} /><span>Cette semaine</span><strong>{formatHours(weekHours)}</strong></div><div><Check size={18} /><span>Ce mois</span><strong>{formatHours(monthHours)}</strong></div><div><LogIn size={18} /><span>Heures prévues</span><strong>{formatHours(plannedHours)}</strong></div></div>

    {nannies[0] && <section className="table-card"><div className="card-heading"><div><p className="eyebrow">{isAdmin ? `${nannies[0].firstName} ${nannies[0].lastName}` : "Mon quota"}</p><h2>Quota d&apos;heures du mois</h2></div><strong>{Math.min(100, Math.round((monthHours / plannedHours) * 100 || 0))}%</strong></div><div className="quota-bar"><div className="quota-bar-fill" style={{ width: `${Math.min(100, (monthHours / plannedHours) * 100 || 0)}%` }} /></div><p className="page-subtitle">{formatHours(monthHours)} validées sur {formatHours(plannedHours)} prévues · estimation utile pour anticiper la prochaine paie.</p></section>}

    <section className="table-card"><div className="card-heading"><div><p className="eyebrow">Ce mois-ci</p><h2>Historique des pointages</h2></div></div><div className="time-table">{rows.length === 0 && <p className="page-subtitle">Aucun pointage ce mois-ci.</p>}{rows.map((entry) => <div className="time-row" key={entry.id}><div><b>{entry.day}</b><small>{entry.date}</small></div><span>{entry.period}</span><span>{entry.arrival}</span><span>{entry.departure}</span><strong>{entry.duration}</strong><em className={entry.status === "En cours" ? "current" : ""}>{entry.status}</em>{isAdmin && <div className="time-row-actions">{entry.canValidate && <form action={validateTimeEntryAction.bind(null, entry.id)}><button type="submit" className="more-button" aria-label="Valider ce pointage"><Check size={15} color="#4e7b68" /></button></form>}{entry.status === "Validée" && <form action={unvalidateTimeEntryAction.bind(null, entry.id)}><button type="submit" className="more-button" aria-label="Annuler la validation"><Undo2 size={15} color="#a9745e" /></button></form>}{entry.canManage && <EditTimeEntryForm entryId={entry.id} nannyName={entry.nannyName} period={entry.periodValue} date={entry.isoDate} arrival={entry.arrival24} departure={entry.departure24} />}<form action={deleteTimeEntryAction.bind(null, entry.id)}><button type="submit" className="more-button" aria-label="Supprimer ce pointage"><Trash2 size={15} color="#b36551" /></button></form></div>}</div>)}</div></section>
  </div></AppShell>;
}

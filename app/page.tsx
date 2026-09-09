import Link from "next/link";
import { Check, ChevronRight, Clock3, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AbsenceRequestForm } from "@/components/dashboard/absence-request-form";
import { DashboardTaskList, type DashboardTask } from "@/components/dashboard/dashboard-task-list";
import { DashboardDateRefresher } from "@/components/dashboard/date-refresher";
import { PayslipDownloadButton } from "@/components/dashboard/payslip-download-button";
import { requireUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";
import { getCurrentMonthPayroll } from "@/lib/payroll";
import { getDayRange, getReferenceToday, toIsoDate } from "@/lib/utils/dates";
import { intlTag, translator } from "@/lib/i18n";
import { deleteTimeEntryAction, validateTimeEntryAction } from "@/app/actions/timesheet";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function StatCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "green" | "blue" | "peach" | "purple" }) {
  return <article className={`stat-card stat-card-${tone}`}><div className="stat-card-heading"><span>{label}</span></div><strong>{value}</strong><p>{detail}</p></article>;
}

function periodLabel(period: "MORNING" | "AFTERNOON") {
  return period === "MORNING" ? "Matin" : "Après-midi";
}

export default async function Home() {
  const user = await requireUser();
  const t = translator(user.language);
  const tag = intlTag(user.language);
  const dateFormatter = new Intl.DateTimeFormat(tag, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeFormatter = new Intl.DateTimeFormat(tag, { hour: "2-digit", minute: "2-digit" });
  const money = (value: number) => new Intl.NumberFormat(tag, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
  const isAdmin = user.role !== "NANNY";
  const today = getReferenceToday();
  const { start, end } = getDayRange(today);

  const [todaysSchedule, todaysTasks, allTasks, absences, nanny] = await Promise.all([
    prisma.schedule.findMany({ where: { familyId: user.familyId, startsAt: { gte: start, lt: end } }, orderBy: { startsAt: "asc" } }),
    prisma.task.findMany({ where: { familyId: user.familyId, dueAt: { gte: start, lt: end } }, include: { child: { select: { firstName: true } } }, orderBy: { dueAt: "asc" } }),
    prisma.task.findMany({ where: { familyId: user.familyId } }),
    prismaFamilyRepository.listAbsences(user.familyId),
    isAdmin ? prismaFamilyRepository.getNanny(user.familyId) : prismaFamilyRepository.getNannyByUserId(user.id),
  ]);

  const pendingTimeEntries = isAdmin
    ? await prisma.timeEntry.findMany({ where: { familyId: user.familyId, arrivalAt: { not: null }, departureAt: { not: null }, status: "PENDING" }, orderBy: { workDate: "desc" }, include: { nanny: { select: { firstName: true, lastName: true } } }, take: 8 })
    : [];

  const payroll = nanny ? (await getCurrentMonthPayroll(user.familyId, nanny.id))?.payroll ?? null : null;
  const tasksDone = allTasks.filter((task) => task.status === "DONE").length;
  const myAbsences = isAdmin ? absences : absences.filter((absence) => absence.person === nanny?.name);
  const pendingCount = absences.filter((absence) => absence.status === "Planifiée").length;

  const dashboardTasks: DashboardTask[] = todaysTasks.map((task) => ({ id: task.id, title: task.title, time: task.dueAt ? timeFormatter.format(task.dueAt) : "", child: task.child?.firstName ?? "Famille", done: task.status === "DONE" }));

  return <AppShell activePath="/" user={user}><DashboardDateRefresher serverDate={toIsoDate(today)} /><div className="content-wrap">
    <section className="welcome-row">
      <div><p className="eyebrow">{dateFormatter.format(today)}</p><h1>Bonjour, {user.name.split(" ")[0]} <span>✦</span></h1><p className="welcome-copy">{isAdmin ? t("dashboard.subtitleAdmin") : t("dashboard.subtitleNanny")}</p></div>
      {isAdmin && <Link className="primary-button" href="/tasks"><Plus size={18} /> {t("dashboard.addTask")}</Link>}
    </section>

    <section className="today-panel">
      <div className="today-intro"><div className="section-icon green-icon"><Clock3 size={20} /></div><div><p className="eyebrow">{t("dashboard.today")}</p><h2>{nanny ? nanny.name : t("dashboard.noNanny")}</h2></div></div>
      <div className="today-metrics">
        <div><small>{t("dashboard.events")}</small><strong>{todaysSchedule.length}</strong></div>
        <div><small>{t("dashboard.tasksToday")}</small><strong>{todaysTasks.length}</strong></div>
        <div><small>{t("dashboard.hoursPlanned")}</small><strong>{nanny ? `${nanny.weeklyHours}h/sem` : "—"}</strong></div>
        <div><small>{t("dashboard.monthlySalary")}</small><strong>{nanny ? money(nanny.monthlySalary) : "—"}</strong></div>
      </div>
      <Link className="outline-button" href="/schedule">{t("dashboard.viewSchedule")} <ChevronRight size={16} /></Link>
    </section>

    <div className="section-heading"><div><p className="eyebrow">{t("dashboard.monthlyActivity")}</p><h2>{t("dashboard.thisMonth")}</h2></div></div>
    <section className="stats-grid">
      <StatCard label={t("dashboard.totalTasks")} value={`${allTasks.length}`} detail={`${tasksDone} ${t("dashboard.completed")}`} tone="green" />
      <StatCard label={t("dashboard.hoursPlanned")} value={nanny ? `${((nanny.weeklyHours * 52) / 12).toFixed(1)}h` : "—"} detail="Base mensuelle" tone="blue" />
      <StatCard label={t("dashboard.absences")} value={`${myAbsences.length}`} detail={isAdmin ? `${pendingCount} ${t("dashboard.pending")}` : t("dashboard.history")} tone="peach" />
      <StatCard label={isAdmin ? t("dashboard.estimatedSalary") : t("dashboard.myEstimatedSalary")} value={payroll ? money(payroll.total) : "—"} detail={t("dashboard.internalCalculation")} tone="purple" />
    </section>

    <section className="lower-grid">
      <article className="chart-card">
        <div className="card-heading"><div><p className="eyebrow">{t("dashboard.planning")}</p><h2>{t("dashboard.today")}</h2></div><Link href="/schedule">{t("common.viewAll")}</Link></div>
        <div className="task-list">{todaysSchedule.length === 0 && <p className="page-subtitle">{t("dashboard.noEventsToday")}</p>}{todaysSchedule.map((event) => <div className="task-row" key={event.id}><div><b>{event.title}</b><small>{timeFormatter.format(event.startsAt)} · {event.type}</small></div></div>)}</div>
      </article>
      <article className="tasks-card">
        <div className="card-heading"><div><p className="eyebrow">{t("dashboard.dontForget")}</p><h2>{isAdmin ? t("dashboard.tasksToday") : t("dashboard.myTasksToday")}</h2></div><Link href="/tasks">{t("common.viewAll")}</Link></div>
        <DashboardTaskList tasks={dashboardTasks} />
        {isAdmin && <Link className="add-task-button" href="/tasks"><Plus size={17} /> {t("dashboard.addTask")}</Link>}
      </article>
    </section>

    {isAdmin && pendingTimeEntries.length > 0 && <section className="table-card" style={{ marginTop: 15 }}>
      <div className="card-heading"><div><p className="eyebrow">Pointages</p><h2>Pointages à valider</h2></div><Link href="/timesheet">{t("common.viewAll")}</Link></div>
      <div className="time-table">{pendingTimeEntries.map((entry) => <div className="time-row" key={entry.id}>
        <div><b>{entry.nanny.firstName} {entry.nanny.lastName}</b><small>{entry.workDate.toLocaleDateString(tag, { day: "2-digit", month: "short" })}</small></div>
        <span>{periodLabel(entry.period)}</span>
        <span>{entry.arrivalAt ? timeFormatter.format(entry.arrivalAt) : "—"}</span>
        <span>{entry.departureAt ? timeFormatter.format(entry.departureAt) : "—"}</span>
        <strong />
        <em>En attente</em>
        <div className="time-row-actions">
          <form action={validateTimeEntryAction.bind(null, entry.id)}><button type="submit" className="more-button" aria-label="Valider ce pointage"><Check size={15} color="#4e7b68" /></button></form>
          <form action={deleteTimeEntryAction.bind(null, entry.id)}><button type="submit" className="more-button" aria-label="Supprimer ce pointage"><Trash2 size={15} color="#b36551" /></button></form>
        </div>
      </div>)}</div>
    </section>}

    {!isAdmin && <section className="lower-grid" style={{ marginTop: 15 }}>
      <article className="payroll-card">
        <div className="card-heading"><div><p className="eyebrow">{t("dashboard.myPayslip")}</p><h2>{t("dashboard.estimatedPay")}</h2></div></div>
        {payroll ? <div className="payroll-lines"><div><span>{t("dashboard.baseSalary")} <small>{payroll.normalHours.toFixed(2)}h</small></span><strong>{money(payroll.baseSalary)}</strong></div><div><span>{t("dashboard.overtime")} <small>{payroll.overtimeHours.toFixed(2)}h</small></span><strong>{money(payroll.overtimePay)}</strong></div><div className="total-line"><span>{t("dashboard.total")}</span><strong>{money(payroll.total)}</strong></div></div> : <p className="page-subtitle">{t("dashboard.noContract")}</p>}
        {payroll && nanny && <PayslipDownloadButton payroll={payroll} nannyName={nanny.name} familyName={user.familyName} />}
      </article>
      <aside className="payroll-total">
        <p className="eyebrow">{t("dashboard.myAbsences")}</p>
        <div className="task-list">{myAbsences.slice(0, 4).map((absence) => <div className="task-row" key={absence.id}><div><b>{absence.type}</b><small>{absence.date} · {absence.status}</small></div></div>)}{myAbsences.length === 0 && <p className="page-subtitle">{t("dashboard.noRequests")}</p>}</div>
        <AbsenceRequestForm />
      </aside>
    </section>}
  </div></AppShell>;
}


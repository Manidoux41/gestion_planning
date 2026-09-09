import { Check, Clock3, LogIn, LogOut } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { mockTimeEntries } from "@/lib/db";
import { ExportTimesheetButton } from "@/components/timesheet/export-timesheet-button";
import { requireUser } from "@/lib/auth/guard";
import { translator } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function TimesheetPage() {
  const user = await requireUser();
  const t = translator(user.language);
  return <AppShell activePath="/timesheet" user={user}><div className="content-wrap app-page"><div className="page-heading"><div><p className="eyebrow">Suivi du temps</p><h1>{t("timesheet.title")}</h1><p className="page-subtitle">{t("timesheet.subtitle")}</p></div><ExportTimesheetButton entries={mockTimeEntries} /></div><section className="clock-panel"><div><p className="eyebrow">Aujourd&apos;hui · 9 septembre</p><h2>La journée est en cours</h2><p>Boneth Deap a pointé son arrivée à 08:04.</p></div><button className="clock-button"><LogOut size={18} /> Pointer le départ</button></section><div className="quick-stats"><div><Clock3 size={18} /><span>Cette semaine</span><strong>40h 00</strong></div><div><Check size={18} /><span>Ce mois</span><strong>126h 42</strong></div><div><LogIn size={18} /><span>Heures prévues</span><strong>160h 00</strong></div></div><section className="table-card"><div className="card-heading"><div><p className="eyebrow">Septembre 2026</p><h2>Historique des pointages</h2></div></div><div className="time-table">{mockTimeEntries.map((entry) => <div className="time-row" key={entry.date}><div><b>{entry.day}</b><small>{entry.date}</small></div><span>{entry.arrival}</span><span>{entry.departure}</span><strong>{entry.duration}</strong><em className={entry.status === "En cours" ? "current" : ""}>{entry.status}</em></div>)}</div></section></div></AppShell>;
}

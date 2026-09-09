import { ChevronRight, Download, FileText } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/guard";
import { translator } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const months = [{ month: "Septembre 2026", hours: "168h", salary: "$1 384", state: "En cours" }, { month: "Août 2026", hours: "160h", salary: "$1 280", state: "Payé" }, { month: "Juillet 2026", hours: "152h", salary: "$1 216", state: "Payé" }];
export default async function HistoryPage() { const user = await requireUser(); const t = translator(user.language); return <AppShell activePath="/payroll" user={user}><div className="content-wrap app-page"><div className="page-heading"><div><p className="eyebrow">Archives</p><h1>{t("history.title")}</h1><p className="page-subtitle">{t("history.subtitle")}</p></div></div><section className="history-list">{months.map((month) => <article className="history-row" key={month.month}><span className="history-icon"><FileText size={19} /></span><div><b>{month.month}</b><small>{month.hours} travaillées · <strong>{month.salary}</strong></small></div><em>{month.state}</em><button aria-label={`Télécharger ${month.month}`}><Download size={17} /></button><ChevronRight size={17} /></article>)}</section></div></AppShell>; }

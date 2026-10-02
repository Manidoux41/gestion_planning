import Link from "next/link";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PayrollManager } from "@/components/payroll/payroll-manager";
import { getMonthPayroll } from "@/lib/payroll";
import { formatPayrollMonth, getPayrollMonth } from "@/lib/payroll/period";
import { requireFamilyAdmin } from "@/lib/auth/guard";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";
import { translator } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  const user = await requireFamilyAdmin();
  const t = translator(user.language);
  const month = getPayrollMonth((await searchParams).month);
  const selectedMonth = formatPayrollMonth(month);
  const previousMonth = formatPayrollMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const nextMonth = formatPayrollMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  const nanny = await prismaFamilyRepository.getNanny(user.familyId);
  const monthly = nanny ? await getMonthPayroll(user.familyId, nanny.id, month) : null;

  if (!nanny || !monthly) {
    return (
      <AppShell activePath="/payroll" user={user}>
        <div className="content-wrap app-page">
          <div className="page-heading">
            <div>
              <p className="eyebrow">Rémunération</p>
              <h1>{t("payroll.title")}</h1>
              <p className="page-subtitle">{t("payroll.subtitle")}</p>
            </div>
          </div>
          <p className="page-subtitle">Aucune employée enregistrée pour le moment.</p>
        </div>
      </AppShell>
    );
  }

  const serializedAdvances = monthly.salaryAdvances.map((adv) => ({
    id: adv.id,
    amount: adv.amount,
    date: adv.date.toISOString(),
    notes: adv.notes,
  }));

  return (
    <AppShell activePath="/payroll" user={user}>
      <div className="content-wrap app-page">
        <PayrollManager
          key={selectedMonth}
          selectedMonth={selectedMonth}
          periodNavigation={
            <nav className="payroll-month-navigation" aria-label="Mois de paie">
              <Link className="calendar-nav-button" href={`/payroll?month=${previousMonth}`} scroll={false} aria-label="Mois précédent" title="Mois précédent">
                <ChevronLeft size={18} />
              </Link>
              <form action="/payroll" method="get" className="payroll-month-form" key={selectedMonth}>
                <label htmlFor="payroll-month">Mois de paie</label>
                <input id="payroll-month" type="month" name="month" defaultValue={selectedMonth} required />
                <button className="calendar-nav-button" type="submit" aria-label="Afficher le mois" title="Afficher le mois">
                  <Check size={18} />
                </button>
              </form>
              <Link className="calendar-nav-button" href={`/payroll?month=${nextMonth}`} scroll={false} aria-label="Mois suivant" title="Mois suivant">
                <ChevronRight size={18} />
              </Link>
              <Link className="today-button" href="/payroll" scroll={false}>Mois courant</Link>
            </nav>
          }
          nanny={{
            id: nanny.id,
            name: nanny.name,
            weeklyHours: nanny.weeklyHours,
            monthlySalary: nanny.monthlySalary,
          }}
          familyName={user.familyName}
          initialPayroll={monthly.payroll}
          periodStart={monthly.periodStart.toISOString()}
          periodEnd={monthly.periodEnd.toISOString()}
          advances={serializedAdvances}
        />
      </div>
    </AppShell>
  );
}



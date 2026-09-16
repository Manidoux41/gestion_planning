import { AppShell } from "@/components/layout/app-shell";
import { PayrollManager } from "@/components/payroll/payroll-manager";
import { getCurrentMonthPayroll } from "@/lib/payroll";
import { requireFamilyAdmin } from "@/lib/auth/guard";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";
import { translator } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PayrollPage() {
  const user = await requireFamilyAdmin();
  const t = translator(user.language);
  const nanny = await prismaFamilyRepository.getNanny(user.familyId);
  const monthly = nanny ? await getCurrentMonthPayroll(user.familyId, nanny.id) : null;

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



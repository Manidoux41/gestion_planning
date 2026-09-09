import { FileText, LockKeyhole } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PayrollActions } from "@/components/payroll/payroll-actions";
import { calculatePayroll } from "@/lib/payroll";
import { mockNanny } from "@/lib/db";
import { requireFamilyAdmin } from "@/lib/auth/guard";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";
import { translator } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const money = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(value);

export default async function PayrollPage() {
  const user = await requireFamilyAdmin();
  const t = translator(user.language);
  const nanny = await prismaFamilyRepository.getNanny(user.familyId) ?? mockNanny;
  const payroll = calculatePayroll({ weeklyHours: nanny.weeklyHours, monthlySalary: nanny.monthlySalary, workedHours: 151.67, overtimeRate: 1.25, bonuses: 0, deductions: 0 });
  return <AppShell activePath="/payroll" user={user}><div className="content-wrap app-page"><div className="page-heading"><div><p className="eyebrow">Rémunération</p><h1>{t("payroll.title")}</h1><p className="page-subtitle">{t("payroll.subtitle")}</p></div><PayrollActions payroll={payroll} /></div><div className="payroll-period"><div><FileText size={19} /><span>Période de paie</span></div><strong>Septembre 2026</strong><span className="status-pill"><span /> Brouillon</span></div><section className="payroll-layout"><article className="payroll-card"><div className="card-heading"><div><p className="eyebrow">Détail du calcul</p><h2>Résumé de la période</h2></div><LockKeyhole size={17} color="#9aa59d" /></div><div className="payroll-lines"><div><span>Salaire mensuel de base <small>{payroll.plannedHours.toFixed(2)}h/mois · {payroll.hourlyEquivalent.toFixed(2)} $/h équivalent</small></span><strong>{money(payroll.baseSalary)}</strong></div><div><span>Heures supplémentaires <small>{payroll.overtimeHours.toFixed(2)}h × 125%</small></span><strong>{money(payroll.overtimePay)}</strong></div><div><span>Primes</span><strong>{money(payroll.bonuses)}</strong></div><div className="total-line"><span>Total estimé <small>Calcul interne</small></span><strong>{money(payroll.total)}</strong></div></div></article><aside className="payroll-total"><p className="eyebrow">Net estimé à payer</p><strong>{money(payroll.total)}</strong><span>{nanny.weeklyHours}h/semaine · {nanny.monthlySalary} $/mois</span><PayrollActions payroll={payroll} /></aside></section><p className="legal-note">Ce document est un calcul interne et ne constitue pas automatiquement une fiche de paie conforme à la législation d&apos;un pays.</p></div></AppShell>;
}


import { prisma } from "@/lib/db/prisma";
import { getMonthBounds, getReferenceToday } from "@/lib/utils/dates";
import { calculatePayroll, type PayrollSummary } from "./calculator";
import { computeProratedPlannedHours, computeWorkedHours } from "./hours";

export type SalaryAdvanceRecord = {
  id: string;
  amount: number;
  date: Date;
  notes: string | null;
};

export type MonthlyPayroll = {
  payroll: PayrollSummary;
  workedHours: number;
  plannedHours: number;
  periodStart: Date;
  periodEnd: Date;
  salaryAdvances: SalaryAdvanceRecord[];
  totalAdvance: number;
};

/**
 * Calcule la paie du mois en cours à partir des seuls pointages validés par la famille,
 * en ignorant tout ce qui précède la date de début de contrat de l'employée,
 * et en déduisant les éventuelles avances sur salaire accordées pendant le mois.
 */
export async function getCurrentMonthPayroll(familyId: string, nannyId: string, overtimeRate = 1.25): Promise<MonthlyPayroll | null> {
  const nannyRecord = await prisma.nanny.findUnique({ where: { id: nannyId } });
  if (!nannyRecord) return null;

  const today = getReferenceToday();
  const { start: monthStart, end: monthEnd } = getMonthBounds(today);
  const periodStart = nannyRecord.startDate && nannyRecord.startDate > monthStart ? nannyRecord.startDate : monthStart;

  const [entries, advances] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { familyId, nannyId, status: "VALIDATED", workDate: { gte: periodStart, lt: monthEnd } },
      include: { breaks: true },
    }),
    prisma.salaryAdvance.findMany({
      where: { familyId, nannyId, date: { gte: periodStart, lt: monthEnd } },
      orderBy: { date: "desc" },
    }),
  ]);

  const workedHours = computeWorkedHours(entries, periodStart, monthEnd);
  const plannedHours = computeProratedPlannedHours(nannyRecord.weeklyHours, periodStart, monthEnd);
  const totalAdvance = advances.reduce((sum, item) => sum + item.amount, 0);

  const payroll = calculatePayroll({
    weeklyHours: nannyRecord.weeklyHours,
    monthlySalary: nannyRecord.monthlySalary ?? 0,
    workedHours,
    overtimeRate,
    salaryAdvance: totalAdvance,
    plannedHoursOverride: plannedHours,
  });

  return {
    payroll,
    workedHours,
    plannedHours,
    periodStart,
    periodEnd: monthEnd,
    salaryAdvances: advances,
    totalAdvance,
  };
}

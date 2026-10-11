import { prisma } from "@/lib/db/prisma";
import { getReferenceToday } from "@/lib/utils/dates";
import { calculatePayroll, type PayrollSummary } from "./calculator";
import { computeProratedPlannedHours, computeWorkedHours, computeWorkedHoursByDay, type WorkedHoursByDay } from "./hours";
import { getPayrollPeriodBounds } from "./period";

export type SalaryAdvanceRecord = {
  id: string;
  amount: number;
  date: Date;
  notes: string | null;
};

export type MonthlyPayroll = {
  payroll: PayrollSummary;
  workedHours: number;
  workedHoursByDay: WorkedHoursByDay[];
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
  return getMonthPayroll(familyId, nannyId, getReferenceToday(), overtimeRate);
}

export async function getMonthPayroll(familyId: string, nannyId: string, month: Date, overtimeRate = 1.25): Promise<MonthlyPayroll | null> {
  const nannyRecord = await prisma.nanny.findUnique({ where: { id: nannyId } });
  if (!nannyRecord) return null;

  const { start: periodStart, end: periodEnd } = getPayrollPeriodBounds(month);
  const effectiveStart = nannyRecord.startDate && nannyRecord.startDate > periodStart ? nannyRecord.startDate : periodStart;

  const [entries, advances] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { familyId, nannyId, status: "VALIDATED", workDate: { gte: effectiveStart, lt: periodEnd } },
      include: { breaks: true },
    }),
    prisma.salaryAdvance.findMany({
      where: { familyId, nannyId, date: { gte: effectiveStart, lt: periodEnd } },
      orderBy: { date: "desc" },
    }),
  ]);

  const workedHours = computeWorkedHours(entries, effectiveStart, periodEnd);
  const workedHoursByDay = computeWorkedHoursByDay(entries, effectiveStart, periodEnd);
  const plannedHours = computeProratedPlannedHours(nannyRecord.weeklyHours, effectiveStart, periodEnd);
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
    workedHoursByDay,
    plannedHours,
    periodStart: effectiveStart,
    periodEnd,
    salaryAdvances: advances,
    totalAdvance,
  };
}

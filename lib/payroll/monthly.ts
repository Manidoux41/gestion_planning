import { prisma } from "@/lib/db/prisma";
import { getMonthBounds, getReferenceToday } from "@/lib/utils/dates";
import { calculatePayroll, type PayrollSummary } from "./calculator";
import { computeProratedPlannedHours, computeWorkedHours } from "./hours";

export type MonthlyPayroll = { payroll: PayrollSummary; workedHours: number; plannedHours: number; periodStart: Date; periodEnd: Date };

/**
 * Calcule la paie du mois en cours à partir des seuls pointages validés par la famille,
 * en ignorant tout ce qui précède la date de début de contrat de l'employée.
 */
export async function getCurrentMonthPayroll(familyId: string, nannyId: string, overtimeRate = 1.25): Promise<MonthlyPayroll | null> {
  const nannyRecord = await prisma.nanny.findUnique({ where: { id: nannyId } });
  if (!nannyRecord) return null;

  const today = getReferenceToday();
  const { start: monthStart, end: monthEnd } = getMonthBounds(today);
  const periodStart = nannyRecord.startDate && nannyRecord.startDate > monthStart ? nannyRecord.startDate : monthStart;

  const entries = await prisma.timeEntry.findMany({
    where: { familyId, nannyId, status: "VALIDATED", workDate: { gte: periodStart, lt: monthEnd } },
    include: { breaks: true },
  });

  const workedHours = computeWorkedHours(entries, periodStart, monthEnd);
  const plannedHours = computeProratedPlannedHours(nannyRecord.weeklyHours, periodStart, monthEnd);
  const payroll = calculatePayroll({ weeklyHours: nannyRecord.weeklyHours, monthlySalary: nannyRecord.monthlySalary ?? 0, workedHours, overtimeRate, plannedHoursOverride: plannedHours });

  return { payroll, workedHours, plannedHours, periodStart, periodEnd: monthEnd };
}

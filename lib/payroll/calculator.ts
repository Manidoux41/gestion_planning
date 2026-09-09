export type PayrollInput = { weeklyHours: number; monthlySalary: number; workedHours: number; overtimeRate: number; bonuses?: number; deductions?: number; plannedHoursOverride?: number };
export type PayrollSummary = { plannedHours: number; normalHours: number; overtimeHours: number; hourlyEquivalent: number; baseSalary: number; overtimePay: number; bonuses: number; deductions: number; total: number };

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

export function getMonthlyHours(weeklyHours: number) {
  return (weeklyHours * WEEKS_PER_YEAR) / MONTHS_PER_YEAR;
}

export function calculatePayroll(input: PayrollInput): PayrollSummary {
  const plannedHours = input.plannedHoursOverride ?? getMonthlyHours(input.weeklyHours);
  const bonuses = input.bonuses ?? 0;
  const deductions = input.deductions ?? 0;
  if (plannedHours <= 0) {
    return { plannedHours: 0, normalHours: 0, overtimeHours: 0, hourlyEquivalent: 0, baseSalary: 0, overtimePay: 0, bonuses, deductions, total: bonuses - deductions };
  }
  const normalHours = Math.min(input.workedHours, plannedHours);
  const rawOvertimeHours = Math.max(input.workedHours - plannedHours, 0);
  const overtimeHours = rawOvertimeHours < 0.01 ? 0 : rawOvertimeHours;
  const hourlyEquivalent = input.monthlySalary / plannedHours;
  const baseSalary = input.monthlySalary * (normalHours / plannedHours);
  const overtimePay = overtimeHours * hourlyEquivalent * input.overtimeRate;
  return { plannedHours, normalHours, overtimeHours, hourlyEquivalent, baseSalary, overtimePay, bonuses, deductions, total: baseSalary + overtimePay + bonuses - deductions };
}

import { getMonthBounds, getReferenceToday, toIsoDate } from "@/lib/utils/dates";

export function getPayrollMonth(value: string | string[] | undefined, today = getReferenceToday()): Date {
  if (typeof value === "string" && /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5, 7));
    return new Date(year, month - 1, 1);
  }
  return getMonthBounds(today).start;
}

export function formatPayrollMonth(month: Date): string {
  return toIsoDate(month).slice(0, 7);
}

export function getPayrollPeriodBounds(month: Date): { start: Date; end: Date } {
  return {
    start: new Date(month.getFullYear(), month.getMonth() - 1, 7),
    end: new Date(month.getFullYear(), month.getMonth(), 7),
  };
}

export function isPayrollDateInPeriod(dateValue: string, month: Date, earliestDate?: Date | null): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return false;

  const year = Number(dateValue.slice(0, 4));
  const monthNumber = Number(dateValue.slice(5, 7));
  const day = Number(dateValue.slice(8, 10));
  const date = new Date(year, monthNumber - 1, day);
  if (toIsoDate(date) !== dateValue) return false;

  const { start, end } = getPayrollPeriodBounds(month);
  const earliestDay = earliestDate
    ? new Date(earliestDate.getFullYear(), earliestDate.getMonth(), earliestDate.getDate())
    : start;
  const effectiveStart = earliestDay > start ? earliestDay : start;

  return date >= effectiveStart && date < end;
}
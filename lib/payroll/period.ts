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
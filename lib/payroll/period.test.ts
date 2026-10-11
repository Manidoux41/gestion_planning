import assert from "node:assert/strict";
import test from "node:test";
import { formatPayrollMonth, getPayrollMonth, getPayrollPeriodBounds, isPayrollDateInPeriod } from "./period";

test("a selected previous month remains selected after the current month changes", () => {
  const month = getPayrollMonth("2026-09", new Date(2026, 9, 2));
  assert.equal(formatPayrollMonth(month), "2026-09");
  assert.equal(month.getDate(), 1);
});

test("previous and next months cross year boundaries", () => {
  const january = getPayrollMonth("2026-01");
  assert.equal(formatPayrollMonth(new Date(january.getFullYear(), january.getMonth() - 1, 1)), "2025-12");
  const december = getPayrollMonth("2025-12");
  assert.equal(formatPayrollMonth(new Date(december.getFullYear(), december.getMonth() + 1, 1)), "2026-01");
});

test("missing, malformed and duplicate months fall back to the current month", () => {
  const today = new Date(2026, 9, 2);
  for (const value of [undefined, "", "2026-00", "2026-13", "2026-9", "invalid", ["2026-09", "2026-10"]]) {
    assert.equal(formatPayrollMonth(getPayrollMonth(value, today)), "2026-10");
  }
});

test("payroll period runs from the 7th of the previous month to the 7th of the selected month", () => {
  const { start, end } = getPayrollPeriodBounds(new Date(2026, 9, 1));
  assert.deepEqual(start, new Date(2026, 8, 7));
  assert.deepEqual(end, new Date(2026, 9, 7));
});

test("September and October pay periods meet on September 7 without overlap", () => {
  const september = getPayrollPeriodBounds(new Date(2026, 8, 1));
  const october = getPayrollPeriodBounds(new Date(2026, 9, 1));

  assert.deepEqual(september.start, new Date(2026, 7, 7));
  assert.deepEqual(september.end, new Date(2026, 8, 7));
  assert.deepEqual(october.start, september.end);
  assert.deepEqual(october.end, new Date(2026, 9, 7));
});

test("advance dates belong only to the selected payroll period", () => {
  const september = new Date(2026, 8, 1);
  const october = new Date(2026, 9, 1);

  assert.equal(isPayrollDateInPeriod("2026-09-06", september), true);
  assert.equal(isPayrollDateInPeriod("2026-09-07", september), false);
  assert.equal(isPayrollDateInPeriod("2026-09-07", october), true);
  assert.equal(isPayrollDateInPeriod("2026-10-06", october), true);
  assert.equal(isPayrollDateInPeriod("2026-10-07", october), false);
  assert.equal(isPayrollDateInPeriod("2026-02-31", october), false);
  assert.equal(isPayrollDateInPeriod("2026-08-06", september, new Date(2026, 7, 15)), false);
});
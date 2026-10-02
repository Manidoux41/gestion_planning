import assert from "node:assert/strict";
import test from "node:test";
import { formatPayrollMonth, getPayrollMonth } from "./period";

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
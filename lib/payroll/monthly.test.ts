import assert from "node:assert/strict";
import test from "node:test";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { getCurrentMonthPayroll, getMonthPayroll } from "./monthly";
import { getReferenceToday } from "@/lib/utils/dates";
import { getPayrollPeriodBounds } from "./period";

test("monthly payroll uses the selected period for validated hours and advances", async (context) => {
  const originalClient = globalThis.prisma;
  let contractStart: Date | null = null;
  let expectedStart = new Date(2026, 7, 7);
  let expectedEnd = new Date(2026, 8, 7);
  let entryQueries = 0;
  let advanceQueries = 0;

  globalThis.prisma = {
    nanny: {
      findUnique: async () => ({ weeklyHours: 40, monthlySalary: 600, startDate: contractStart }),
    },
    timeEntry: {
      findMany: async ({ where }: { where: { familyId: string; nannyId: string; status: string; workDate: { gte: Date; lt: Date } } }) => {
        entryQueries += 1;
        assert.equal(where.familyId, "family-test");
        assert.equal(where.nannyId, "nanny-test");
        assert.equal(where.status, "VALIDATED");
        assert.deepEqual(where.workDate, { gte: expectedStart, lt: expectedEnd });
        return [{
          workDate: new Date(expectedStart.getFullYear(), expectedStart.getMonth(), expectedStart.getDate()),
          arrivalAt: new Date(expectedStart.getFullYear(), expectedStart.getMonth(), expectedStart.getDate(), 8),
          departureAt: new Date(expectedStart.getFullYear(), expectedStart.getMonth(), expectedStart.getDate(), 16),
          breaks: [],
        }];
      },
    },
    salaryAdvance: {
      findMany: async ({ where }: { where: { familyId: string; nannyId: string; date: { gte: Date; lt: Date } } }) => {
        advanceQueries += 1;
        assert.equal(where.familyId, "family-test");
        assert.equal(where.nannyId, "nanny-test");
        assert.deepEqual(where.date, { gte: expectedStart, lt: expectedEnd });
        return [{ id: "advance-test", amount: 25, date: expectedStart, notes: null }];
      },
    },
  } as unknown as PrismaClient;

  try {
    await context.test("September can be calculated independently of today", async () => {
      const result = await getMonthPayroll("family-test", "nanny-test", new Date(2026, 8, 20));
      assert.ok(result);
      assert.deepEqual(result.periodStart, expectedStart);
      assert.deepEqual(result.periodEnd, expectedEnd);
      assert.equal(result.workedHours, 8);
      assert.deepEqual(result.workedHoursByDay, [{ date: expectedStart, hours: 8 }]);
      assert.equal(result.totalAdvance, 25);
      assert.equal(result.payroll.salaryAdvance, 25);
      assert.equal(result.payroll.total, result.payroll.earnedSalary - 25);
    });

    await context.test("contract start is respected inside a historical month", async () => {
      contractStart = new Date(2026, 7, 15);
      expectedStart = contractStart;
      const result = await getMonthPayroll("family-test", "nanny-test", new Date(2026, 8, 1));
      assert.ok(result);
      assert.deepEqual(result.periodStart, contractStart);
      assert.equal(result.plannedHours, (40 / 7) * 23);
    });

    await context.test("the dashboard wrapper still uses the current month", async () => {
      contractStart = null;
      const bounds = getPayrollPeriodBounds(getReferenceToday());
      expectedStart = bounds.start;
      expectedEnd = bounds.end;
      const result = await getCurrentMonthPayroll("family-test", "nanny-test");
      assert.ok(result);
      assert.deepEqual(result.periodStart, expectedStart);
      assert.deepEqual(result.periodEnd, expectedEnd);
    });
    assert.equal(entryQueries, 3);
    assert.equal(advanceQueries, 3);
  } finally {
    globalThis.prisma = originalClient;
  }
});
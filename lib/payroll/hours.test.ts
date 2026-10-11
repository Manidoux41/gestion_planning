import assert from "node:assert/strict";
import test from "node:test";
import { computeWorkedHours, computeWorkedHoursByDay } from "./hours";

test("daily hours combine entries, subtract breaks and add up to the period total", () => {
  const periodStart = new Date(2026, 9, 7);
  const periodEnd = new Date(2026, 10, 7);
  const entries = [
    {
      workDate: new Date(2026, 9, 9),
      arrivalAt: new Date(2026, 9, 9, 8),
      departureAt: new Date(2026, 9, 9, 12),
      breaks: [{ startsAt: new Date(2026, 9, 9, 10), endsAt: new Date(2026, 9, 9, 10, 30) }],
    },
    {
      workDate: new Date(2026, 9, 9),
      arrivalAt: new Date(2026, 9, 9, 13),
      departureAt: new Date(2026, 9, 9, 17),
      breaks: [],
    },
    {
      workDate: new Date(2026, 9, 8),
      arrivalAt: new Date(2026, 9, 8, 9),
      departureAt: new Date(2026, 9, 8, 10),
      breaks: [],
    },
  ];

  const daily = computeWorkedHoursByDay(entries, periodStart, periodEnd);
  assert.deepEqual(daily, [
    { date: new Date(2026, 9, 8), hours: 1 },
    { date: new Date(2026, 9, 9), hours: 7.5 },
  ]);
  assert.equal(daily.reduce((total, day) => total + day.hours, 0), computeWorkedHours(entries, periodStart, periodEnd));
});

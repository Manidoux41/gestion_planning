export { mockAbsences, mockChildren, mockFamily, mockNanny, mockTasks, mockTimeEntries, workedHours } from "./mock-data";
export type { Absence, Child, CurrencyCode, Family, Nanny, ScheduleEvent, Task, TaskCategory, TaskPriority, TimeEntry, TimeEntryStatus } from "./domain-types";

export const dbMode = "mock" as const;

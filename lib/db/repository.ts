import type { Child, Family, Nanny, ScheduleEvent, Task } from "./domain-types";

/** Repository contract shared by the mock adapter and the future Prisma adapter. */
export interface FamilyRepository {
  getFamily(familyId: string): Promise<Family | null>;
  getNanny(familyId: string): Promise<Nanny | null>;
  listChildren(familyId: string): Promise<Child[]>;
  createChild(familyId: string, child: Omit<Child, "id">): Promise<Child>;
  listTasks(familyId: string): Promise<Task[]>;
  createTask(familyId: string, task: Omit<Task, "id">): Promise<Task>;
  listScheduleEvents(familyId: string): Promise<ScheduleEvent[]>;
  createScheduleEvent(familyId: string, event: Omit<ScheduleEvent, "id">): Promise<ScheduleEvent>;
}

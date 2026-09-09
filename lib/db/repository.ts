import type { Absence, Child, Family, Nanny, NannyRecord, ScheduleEvent, Task } from "./domain-types";

/** Repository contract shared by the mock adapter and the future Prisma adapter. */
export interface FamilyRepository {
  getFamily(familyId: string): Promise<Family | null>;
  getNanny(familyId: string): Promise<Nanny | null>;
  getNannyByUserId(userId: string): Promise<Nanny | null>;
  listNannies(familyId: string): Promise<NannyRecord[]>;
  listChildren(familyId: string): Promise<Child[]>;
  createChild(familyId: string, child: Omit<Child, "id">): Promise<Child>;
  listTasks(familyId: string): Promise<Task[]>;
  createTask(familyId: string, task: Omit<Task, "id">): Promise<Task>;
  listScheduleEvents(familyId: string): Promise<ScheduleEvent[]>;
  createScheduleEvent(familyId: string, event: Omit<ScheduleEvent, "id">): Promise<ScheduleEvent>;
  listAbsences(familyId: string): Promise<Absence[]>;
}


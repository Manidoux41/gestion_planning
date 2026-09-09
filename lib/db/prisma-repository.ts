import { prisma } from "./prisma";
import type { Child, Family, Nanny, ScheduleEvent, Task } from "./domain-types";
import type { FamilyRepository } from "./repository";

function toChild(record: { id: string; firstName: string; lastName: string | null; school: string | null }): Child {
  const name = [record.firstName, record.lastName].filter(Boolean).join(" ");
  return { id: record.id, name, age: 0, school: record.school ?? "À préciser", color: "sage", initials: name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() };
}

function toTask(record: { id: string; title: string; dueAt: Date | null; category: string; priority: "NORMALE" | "IMPORTANT"; status: "TODO" | "IN_PROGRESS" | "DONE"; child: { firstName: string } | null }): Task {
  return { id: record.id, title: record.title, time: record.dueAt ? record.dueAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "", child: record.child?.firstName ?? "Famille", category: record.category as Task["category"], priority: record.priority === "IMPORTANT" ? "Important" : "Normale", done: record.status === "DONE" };
}

function toEvent(record: { id: string; title: string; type: string; startsAt: Date }): ScheduleEvent {
  return { id: record.id, title: record.title, type: record.type as ScheduleEvent["type"], time: record.startsAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) };
}

export const prismaFamilyRepository: FamilyRepository = {
  async getFamily(familyId: string): Promise<Family | null> {
    const record = await prisma.family.findUnique({ where: { id: familyId } });
    return record ? { id: record.id, name: record.name, address: record.address ?? "", phone: record.phone ?? "", currency: record.currency as Family["currency"] } : null;
  },
  async getNanny(familyId: string): Promise<Nanny | null> {
    const record = await prisma.nanny.findFirst({ where: { familyId }, orderBy: { createdAt: "asc" } });
    return record ? { id: record.id, name: `${record.firstName} ${record.lastName}`, role: "Nounou principale", phone: record.phone ?? "", email: record.email ?? "", monthlySalary: record.monthlySalary ?? 0, weeklyHours: record.weeklyHours, startDate: record.startDate?.toLocaleDateString("fr-FR") ?? "" } : null;
  },
  async listChildren(familyId: string) {
    const records = await prisma.child.findMany({ where: { familyId }, orderBy: { firstName: "asc" } });
    return records.map(toChild);
  },
  async createChild(familyId: string, child: Omit<Child, "id">) {
    const [firstName = "Enfant", ...lastNameParts] = child.name.trim().split(/\s+/);
    const record = await prisma.child.create({ data: { familyId, firstName, lastName: lastNameParts.join(" ") || null, school: child.school } });
    return toChild(record);
  },
  async listTasks(familyId: string) {
    const records = await prisma.task.findMany({ where: { familyId }, include: { child: { select: { firstName: true } } }, orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }] });
    return records.map(toTask);
  },
  async createTask(familyId: string, task: Omit<Task, "id">) {
    const record = await prisma.task.create({ data: { familyId, title: task.title, category: task.category, priority: task.priority === "Important" ? "IMPORTANT" : "NORMALE", status: task.done ? "DONE" : "TODO", dueAt: task.time ? new Date(`2026-09-09T${task.time}:00`) : null } , include: { child: { select: { firstName: true } } } });
    return toTask(record);
  },
  async listScheduleEvents(familyId: string) {
    const records = await prisma.schedule.findMany({ where: { familyId }, orderBy: { startsAt: "asc" } });
    return records.map(toEvent);
  },
  async createScheduleEvent(familyId: string, event: Omit<ScheduleEvent, "id">) {
    const record = await prisma.schedule.create({ data: { familyId, title: event.title, type: event.type, startsAt: new Date(`2026-09-09T${event.time}:00`) } });
    return toEvent(record);
  },
};

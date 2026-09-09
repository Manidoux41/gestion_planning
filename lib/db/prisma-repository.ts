import { prisma } from "./prisma";
import type { Absence, Child, Family, Nanny, ScheduleEvent, Task } from "./domain-types";
import type { FamilyRepository } from "./repository";
import { toIsoDate } from "@/lib/utils/dates";

const absenceTypeLabels: Record<string, string> = {
  CONGE: "Congé",
  MALADIE: "Maladie",
  EXCEPTIONNELLE: "Absence exceptionnelle",
  JOUR_FERIE: "Jour férié",
  ABSENCE_ENFANT: "Absence de l'enfant",
  ABSENCE_NOUNOU: "Absence de la nounou",
};

const absenceStatusLabels: Record<string, Absence["status"]> = {
  PENDING: "Planifiée",
  APPROVED: "Confirmée",
  REJECTED: "Annulée",
};

function toNanny(record: { id: string; firstName: string; lastName: string; phone: string | null; email: string | null; monthlySalary: number | null; weeklyHours: number; startDate: Date | null }): Nanny {
  return { id: record.id, name: `${record.firstName} ${record.lastName}`, role: "Nounou principale", phone: record.phone ?? "", email: record.email ?? "", monthlySalary: record.monthlySalary ?? 0, weeklyHours: record.weeklyHours, startDate: record.startDate?.toLocaleDateString("fr-FR") ?? "" };
}


function toChild(record: { id: string; firstName: string; lastName: string | null; school: string | null }): Child {
  const name = [record.firstName, record.lastName].filter(Boolean).join(" ");
  return { id: record.id, name, age: 0, school: record.school ?? "À préciser", color: "sage", initials: name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() };
}

function toTask(record: { id: string; title: string; dueAt: Date | null; endAt: Date | null; category: string; priority: "NORMALE" | "IMPORTANT"; status: "TODO" | "IN_PROGRESS" | "DONE"; child: { firstName: string } | null }): Task {
  return {
    id: record.id,
    title: record.title,
    date: record.dueAt ? toIsoDate(record.dueAt) : "",
    time: record.dueAt ? record.dueAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "",
    endTime: record.endAt ? record.endAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "",
    child: record.child?.firstName ?? "Famille",
    category: record.category as Task["category"],
    priority: record.priority === "IMPORTANT" ? "Important" : "Normale",
    done: record.status === "DONE",
  };
}

function toEvent(record: { id: string; title: string; type: string; startsAt: Date; endsAt: Date | null }): ScheduleEvent {
  return { id: record.id, date: toIsoDate(record.startsAt), title: record.title, type: record.type as ScheduleEvent["type"], time: record.startsAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), endTime: record.endsAt ? record.endsAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "" };
}

export const prismaFamilyRepository: FamilyRepository = {
  async getFamily(familyId: string): Promise<Family | null> {
    const record = await prisma.family.findUnique({ where: { id: familyId } });
    return record ? { id: record.id, name: record.name, address: record.address ?? "", phone: record.phone ?? "", currency: record.currency as Family["currency"] } : null;
  },
  async getNanny(familyId: string): Promise<Nanny | null> {
    const record = await prisma.nanny.findFirst({ where: { familyId }, orderBy: { createdAt: "asc" } });
    return record ? toNanny(record) : null;
  },
  async getNannyByUserId(userId: string): Promise<Nanny | null> {
    const record = await prisma.nanny.findUnique({ where: { userId } });
    return record ? toNanny(record) : null;
  },
  async listNannies(familyId: string) {
    const records = await prisma.nanny.findMany({ where: { familyId }, include: { user: { select: { username: true } } }, orderBy: { createdAt: "asc" } });
    return records.map((record) => ({ id: record.id, name: `${record.firstName} ${record.lastName}`, email: record.email, username: record.user?.username ?? null, hourlyRate: record.hourlyRate, monthlySalary: record.monthlySalary, weeklyHours: record.weeklyHours, hasAccount: record.userId !== null }));
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
    const dueAt = task.date && task.time ? new Date(`${task.date}T${task.time}:00`) : null;
    const endAt = task.date && task.endTime ? new Date(`${task.date}T${task.endTime}:00`) : null;
    const record = await prisma.task.create({ data: { familyId, title: task.title, category: task.category, priority: task.priority === "Important" ? "IMPORTANT" : "NORMALE", status: task.done ? "DONE" : "TODO", dueAt, endAt }, include: { child: { select: { firstName: true } } } });
    return toTask(record);
  },
  async listScheduleEvents(familyId: string) {
    const records = await prisma.schedule.findMany({ where: { familyId }, orderBy: { startsAt: "asc" } });
    return records.map(toEvent);
  },
  async createScheduleEvent(familyId: string, event: Omit<ScheduleEvent, "id">) {
    const startsAt = new Date(`${event.date}T${event.time}:00`);
    const endsAt = event.endTime ? new Date(`${event.date}T${event.endTime}:00`) : null;
    const record = await prisma.schedule.create({ data: { familyId, title: event.title, type: event.type, startsAt, endsAt } });
    return toEvent(record);
  },
  async listAbsences(familyId: string): Promise<Absence[]> {
    const records = await prisma.absence.findMany({ where: { familyId }, include: { nanny: { select: { firstName: true, lastName: true } } }, orderBy: { startsOn: "desc" } });
    return records.map((record) => ({
      id: record.id,
      date: record.startsOn.toLocaleDateString("fr-FR") === record.endsOn.toLocaleDateString("fr-FR") ? record.startsOn.toLocaleDateString("fr-FR") : `${record.startsOn.toLocaleDateString("fr-FR")} - ${record.endsOn.toLocaleDateString("fr-FR")}`,
      type: absenceTypeLabels[record.type] ?? record.type,
      person: record.nanny ? `${record.nanny.firstName} ${record.nanny.lastName}` : "Famille",
      duration: `${Math.max(1, Math.round((record.endsOn.getTime() - record.startsOn.getTime()) / 86_400_000))} jour(s)`,
      status: absenceStatusLabels[record.status] ?? "Planifiée",
    }));
  },
};


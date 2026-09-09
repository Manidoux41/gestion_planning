import type { Absence, Child, Family, Nanny, Task, TimeEntry } from "./domain-types";

export type { Absence, Child, Family, Nanny, Task, TimeEntry } from "./domain-types";

export const mockFamily: Family = { id: "family_demo_martin", name: "Famille Martin", address: "12 rue des Lilas, 75011 Paris", phone: "+33 6 12 34 56 78", currency: "USD" };
export const mockNanny: Nanny = { id: "nanny_demo_boneth", name: "Boneth Deap", role: "Nounou principale", phone: "+33 6 45 78 12 09", email: "boneth.deap@example.com", monthlySalary: 330, weeklyHours: 35, startDate: "01 septembre 2025" };
export const mockChildren: Child[] = [
  { id: "loukas", name: "Loukas Martin", age: 7, school: "École des Lilas", color: "sage", initials: "LM" },
  { id: "illyana", name: "Illyana Martin", age: 4, school: "École des Lilas", color: "peach", initials: "IM" },
];
export const mockTasks: Task[] = [
  { id: "task-1", title: "Récupérer Loukas à l'école", date: "2026-09-09", time: "15:30", endTime: "16:00", child: "Loukas", category: "École", priority: "Important", done: false },
  { id: "task-2", title: "Préparer le goûter", date: "2026-09-09", time: "16:00", endTime: "16:30", child: "Loukas & Illyana", category: "Repas", priority: "Normale", done: true },
  { id: "task-3", title: "Vérifier les devoirs", date: "2026-09-09", time: "17:00", endTime: "17:30", child: "Illyana", category: "Enfants", priority: "Normale", done: false },
  { id: "task-4", title: "Préparer les vêtements de demain", date: "2026-09-09", time: "18:00", endTime: "18:15", child: "Loukas & Illyana", category: "Maison", priority: "Normale", done: false },
];
export const mockTimeEntries: TimeEntry[] = [
  { id: "time-1", date: "09 sept.", day: "Mardi", period: "Matin", arrival: "08:04", departure: "En cours", duration: "3h 56", status: "En cours" },
  { id: "time-2", date: "08 sept.", day: "Lundi", period: "Matin", arrival: "08:00", departure: "12:00", duration: "4h 00", status: "Validée" },
  { id: "time-3", date: "08 sept.", day: "Lundi", period: "Après-midi", arrival: "13:30", departure: "18:02", duration: "4h 32", status: "Validée" },
  { id: "time-4", date: "07 sept.", day: "Vendredi", period: "Matin", arrival: "08:03", departure: "12:00", duration: "3h 57", status: "Validée" },
];
export const mockAbsences: Absence[] = [
  { id: "absence-1", date: "12 sept. 2026", type: "Absence de l'enfant", person: "Loukas", duration: "1 jour", status: "Planifiée" },
  { id: "absence-2", date: "21 - 25 sept. 2026", type: "Congés", person: "Boneth Deap", duration: "5 jours", status: "Planifiée" },
];
export const workedHours = [8, 7.5, 8, 6.7, 8, 0, 0];

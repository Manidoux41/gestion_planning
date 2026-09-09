import type { Absence, Child, Family, Nanny, Task, TimeEntry } from "./domain-types";

export type { Absence, Child, Family, Nanny, Task, TimeEntry } from "./domain-types";

export const mockFamily: Family = { id: "family_demo_martin", name: "Famille Martin", address: "12 rue des Lilas, 75011 Paris", phone: "+33 6 12 34 56 78", currency: "USD" };
export const mockNanny: Nanny = { id: "nanny_demo_boneth", name: "Boneth Deap", role: "Nounou principale", phone: "+33 6 45 78 12 09", email: "boneth.deap@example.com", monthlySalary: 330, weeklyHours: 35, startDate: "01 septembre 2025" };
export const mockChildren: Child[] = [
  { id: "loukas", name: "Loukas Martin", age: 7, school: "École des Lilas", color: "sage", initials: "LM" },
  { id: "illyana", name: "Illyana Martin", age: 4, school: "École des Lilas", color: "peach", initials: "IM" },
];
export const mockTasks: Task[] = [
  { id: "task-1", title: "Récupérer Loukas à l'école", time: "15:30", child: "Loukas", category: "École", priority: "Important", done: false },
  { id: "task-2", title: "Préparer le goûter", time: "16:00", child: "Loukas & Illyana", category: "Repas", priority: "Normale", done: true },
  { id: "task-3", title: "Vérifier les devoirs", time: "17:00", child: "Illyana", category: "Enfants", priority: "Normale", done: false },
  { id: "task-4", title: "Préparer les vêtements de demain", time: "18:00", child: "Loukas & Illyana", category: "Maison", priority: "Normale", done: false },
];
export const mockTimeEntries: TimeEntry[] = [
  { id: "time-1", date: "09 sept.", day: "Mardi", arrival: "08:04", departure: "En cours", duration: "6h 42", status: "En cours" },
  { id: "time-2", date: "08 sept.", day: "Lundi", arrival: "08:00", departure: "18:02", duration: "9h 32", status: "Validée" },
  { id: "time-3", date: "07 sept.", day: "Vendredi", arrival: "08:03", departure: "17:58", duration: "9h 25", status: "Validée" },
  { id: "time-4", date: "04 sept.", day: "Jeudi", arrival: "08:00", departure: "18:00", duration: "9h 30", status: "Validée" },
];
export const mockAbsences: Absence[] = [
  { id: "absence-1", date: "12 sept. 2026", type: "Absence de l'enfant", person: "Loukas", duration: "1 jour", status: "Planifiée" },
  { id: "absence-2", date: "21 - 25 sept. 2026", type: "Congés", person: "Boneth Deap", duration: "5 jours", status: "Planifiée" },
];
export const workedHours = [8, 7.5, 8, 6.7, 8, 0, 0];

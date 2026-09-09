export type CurrencyCode = "USD" | "EUR" | "KHR";
export type ChildColor = "sage" | "peach";
export type TaskPriority = "Normale" | "Important";
export type TaskCategory = "Enfants" | "École" | "Repas" | "Maison" | "Courses" | "Hygiène" | "Administratif" | "Autre";
export type TimeEntryStatus = "En cours" | "En attente" | "Validée";
export type AbsenceStatus = "Planifiée" | "Confirmée" | "Annulée";
export type ScheduleEventType = "Présence" | "Enfants" | "École" | "Repas" | "Autre";

export type Child = { id: string; name: string; age: number; school: string; color: ChildColor; initials: string };
export type Nanny = { id: string; name: string; role: string; phone: string; email: string; monthlySalary: number; weeklyHours: number; startDate: string };
export type NannyRecord = { id: string; name: string; email: string | null; username: string | null; hourlyRate: number | null; monthlySalary: number | null; weeklyHours: number; hasAccount: boolean; startDate: string | null };
export type Task = { id: string; title: string; date: string; time: string; endTime: string; child: string; category: TaskCategory; priority: TaskPriority; done: boolean };
export type TimeEntry = { id: string; date: string; day: string; period: string; arrival: string; departure: string; duration: string; status: TimeEntryStatus };
export type Absence = { id: string; date: string; type: string; person: string; duration: string; status: AbsenceStatus };
export type ScheduleEvent = { id: string; date: string; time: string; endTime: string; title: string; type: ScheduleEventType };

export type Family = { id: string; name: string; address: string; phone: string; currency: CurrencyCode };

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireFamilyAdmin, requireUser } from "@/lib/auth/guard";
import { getDayRange, getReferenceToday } from "@/lib/utils/dates";

export type TimesheetActionState = { ok: boolean; error?: string };

type TimeEntryPeriod = "MORNING" | "AFTERNOON";

function today() {
  return getDayRange(getReferenceToday()).start;
}

async function getTodayEntries(nannyId: string, workDate: Date) {
  const entries = await prisma.timeEntry.findMany({ where: { nannyId, workDate } });
  return {
    morning: entries.find((entry) => entry.period === "MORNING"),
    afternoon: entries.find((entry) => entry.period === "AFTERNOON"),
  };
}

export async function clockInAction(): Promise<TimesheetActionState> {
  const user = await requireUser();
  if (!user.nannyId) return { ok: false, error: "Seule une employée peut pointer son arrivée." };

  const workDate = today();
  const { morning, afternoon } = await getTodayEntries(user.nannyId, workDate);
  const now = new Date();

  if (!morning?.arrivalAt) {
    if (morning) {
      await prisma.timeEntry.update({ where: { id: morning.id }, data: { arrivalAt: now, status: "PENDING" } });
    } else {
      await prisma.timeEntry.create({ data: { familyId: user.familyId, nannyId: user.nannyId, workDate, period: "MORNING", arrivalAt: now } });
    }
  } else if (!morning.departureAt) {
    return { ok: false, error: "Pointez d'abord le départ du matin." };
  } else if (!afternoon?.arrivalAt) {
    if (afternoon) {
      await prisma.timeEntry.update({ where: { id: afternoon.id }, data: { arrivalAt: now, status: "PENDING" } });
    } else {
      await prisma.timeEntry.create({ data: { familyId: user.familyId, nannyId: user.nannyId, workDate, period: "AFTERNOON", arrivalAt: now } });
    }
  } else if (!afternoon.departureAt) {
    return { ok: false, error: "Pointez d'abord le départ de l'après-midi." };
  } else {
    return { ok: false, error: "Les pointages du matin et de l'après-midi sont déjà terminés." };
  }

  revalidatePath("/timesheet");
  revalidatePath("/");
  return { ok: true };
}

export async function clockOutAction(): Promise<TimesheetActionState> {
  const user = await requireUser();
  if (!user.nannyId) return { ok: false, error: "Seule une employée peut pointer son départ." };

  const workDate = today();
  const { morning, afternoon } = await getTodayEntries(user.nannyId, workDate);
  const now = new Date();

  if (morning?.arrivalAt && !morning.departureAt) {
    await prisma.timeEntry.update({ where: { id: morning.id }, data: { departureAt: now } });
  } else if (afternoon?.arrivalAt && !afternoon.departureAt) {
    await prisma.timeEntry.update({ where: { id: afternoon.id }, data: { departureAt: now } });
  } else if (!morning?.arrivalAt) {
    return { ok: false, error: "Aucune arrivée du matin pointée aujourd'hui." };
  } else if (!afternoon?.arrivalAt) {
    return { ok: false, error: "Pointez d'abord l'arrivée de l'après-midi." };
  } else {
    return { ok: false, error: "Les deux départs ont déjà été pointés aujourd'hui." };
  }

  revalidatePath("/timesheet");
  revalidatePath("/");
  return { ok: true };
}

export async function validateTimeEntryAction(entryId: string) {
  const admin = await requireFamilyAdmin();
  await prisma.timeEntry.updateMany({ where: { id: entryId, familyId: admin.familyId }, data: { status: "VALIDATED" } });
  revalidatePath("/timesheet");
  revalidatePath("/payroll");
  revalidatePath("/");
}

/** Permet à la famille de revenir sur une validation (le pointage repasse en attente). */
export async function unvalidateTimeEntryAction(entryId: string) {
  const admin = await requireFamilyAdmin();
  await prisma.timeEntry.updateMany({ where: { id: entryId, familyId: admin.familyId }, data: { status: "PENDING" } });
  revalidatePath("/timesheet");
  revalidatePath("/payroll");
  revalidatePath("/");
}

/** Permet à la famille de supprimer un pointage erroné. */
export async function deleteTimeEntryAction(entryId: string) {
  const admin = await requireFamilyAdmin();
  await prisma.timeEntry.deleteMany({ where: { id: entryId, familyId: admin.familyId } });
  revalidatePath("/timesheet");
  revalidatePath("/payroll");
  revalidatePath("/");
}

const manualEntrySchema = z.object({
  nannyId: z.string().min(1, "Employée requise."),
  period: z.enum(["MORNING", "AFTERNOON"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
  arrival: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure d'arrivée invalide."),
  departure: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure de départ invalide."),
}).refine((data) => data.departure > data.arrival, { message: "Le départ doit être après l'arrivée.", path: ["departure"] });

/** Permet à la famille d'ajouter ou de corriger manuellement un pointage (oublié ou noté en retard). */
export async function createManualTimeEntryAction(_prevState: TimesheetActionState, formData: FormData): Promise<TimesheetActionState> {
  const admin = await requireFamilyAdmin();
  const parsed = manualEntrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const nanny = await prisma.nanny.findFirst({ where: { id: parsed.data.nannyId, familyId: admin.familyId } });
  if (!nanny) return { ok: false, error: "Employée introuvable." };

  const workDate = new Date(`${parsed.data.date}T00:00:00`);
  const arrivalAt = new Date(`${parsed.data.date}T${parsed.data.arrival}:00`);
  const departureAt = new Date(`${parsed.data.date}T${parsed.data.departure}:00`);
  const period = parsed.data.period as TimeEntryPeriod;

  await prisma.timeEntry.upsert({
    where: { nannyId_workDate_period: { nannyId: nanny.id, workDate, period } },
    create: { familyId: admin.familyId, nannyId: nanny.id, workDate, period, arrivalAt, departureAt, status: "VALIDATED" },
    update: { arrivalAt, departureAt, status: "VALIDATED" },
  });

  revalidatePath("/timesheet");
  revalidatePath("/payroll");
  revalidatePath("/");
  return { ok: true };
}

const updateEntrySchema = z.object({
  entryId: z.string().min(1),
  period: z.enum(["MORNING", "AFTERNOON"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
  arrival: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure d'arrivée invalide."),
  departure: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure de départ invalide."),
}).refine((data) => data.departure > data.arrival, { message: "Le départ doit être après l'arrivée.", path: ["departure"] });

/** Permet à la famille de modifier un pointage existant (heures ou date incorrectes). */
export async function updateTimeEntryAction(_prevState: TimesheetActionState, formData: FormData): Promise<TimesheetActionState> {
  const admin = await requireFamilyAdmin();
  const parsed = updateEntrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const entry = await prisma.timeEntry.findFirst({ where: { id: parsed.data.entryId, familyId: admin.familyId } });
  if (!entry) return { ok: false, error: "Pointage introuvable." };

  const workDate = new Date(`${parsed.data.date}T00:00:00`);
  const arrivalAt = new Date(`${parsed.data.date}T${parsed.data.arrival}:00`);
  const departureAt = new Date(`${parsed.data.date}T${parsed.data.departure}:00`);
  const period = parsed.data.period as TimeEntryPeriod;

  if (workDate.getTime() !== entry.workDate.getTime() || period !== entry.period) {
    const conflict = await prisma.timeEntry.findUnique({ where: { nannyId_workDate_period: { nannyId: entry.nannyId, workDate, period } } });
    if (conflict && conflict.id !== entry.id) return { ok: false, error: "Un pointage existe déjà pour cette employée à cette date." };
  }

  await prisma.timeEntry.update({ where: { id: entry.id }, data: { workDate, period, arrivalAt, departureAt, status: "VALIDATED" } });

  revalidatePath("/timesheet");
  revalidatePath("/payroll");
  revalidatePath("/");
  return { ok: true };
}

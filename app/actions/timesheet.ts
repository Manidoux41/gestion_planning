"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireFamilyAdmin, requireUser } from "@/lib/auth/guard";
import { getDayRange, getReferenceToday } from "@/lib/utils/dates";

export type TimesheetActionState = { ok: boolean; error?: string };

function today() {
  return getDayRange(getReferenceToday()).start;
}

export async function clockInAction(): Promise<TimesheetActionState> {
  const user = await requireUser();
  if (!user.nannyId) return { ok: false, error: "Seule une employée peut pointer son arrivée." };

  const workDate = today();
  const existing = await prisma.timeEntry.findUnique({ where: { nannyId_workDate: { nannyId: user.nannyId, workDate } } });
  if (existing?.arrivalAt) return { ok: false, error: "L'arrivée a déjà été pointée aujourd'hui." };

  if (existing) {
    await prisma.timeEntry.update({ where: { id: existing.id }, data: { arrivalAt: new Date(), status: "PENDING" } });
  } else {
    await prisma.timeEntry.create({ data: { familyId: user.familyId, nannyId: user.nannyId, workDate, arrivalAt: new Date() } });
  }

  revalidatePath("/timesheet");
  revalidatePath("/");
  return { ok: true };
}

export async function clockOutAction(): Promise<TimesheetActionState> {
  const user = await requireUser();
  if (!user.nannyId) return { ok: false, error: "Seule une employée peut pointer son départ." };

  const workDate = today();
  const existing = await prisma.timeEntry.findUnique({ where: { nannyId_workDate: { nannyId: user.nannyId, workDate } } });
  if (!existing?.arrivalAt) return { ok: false, error: "Aucune arrivée pointée aujourd'hui." };
  if (existing.departureAt) return { ok: false, error: "Le départ a déjà été pointé aujourd'hui." };

  await prisma.timeEntry.update({ where: { id: existing.id }, data: { departureAt: new Date() } });
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

const manualEntrySchema = z.object({
  nannyId: z.string().min(1, "Employée requise."),
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

  await prisma.timeEntry.upsert({
    where: { nannyId_workDate: { nannyId: nanny.id, workDate } },
    create: { familyId: admin.familyId, nannyId: nanny.id, workDate, arrivalAt, departureAt, status: "VALIDATED" },
    update: { arrivalAt, departureAt, status: "VALIDATED" },
  });

  revalidatePath("/timesheet");
  revalidatePath("/payroll");
  revalidatePath("/");
  return { ok: true };
}

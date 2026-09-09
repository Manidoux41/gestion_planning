"use server";

import { revalidatePath } from "next/cache";
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

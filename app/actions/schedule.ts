"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireFamilyAdmin } from "@/lib/auth/guard";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";

const scheduleInput = z.object({ title: z.string().trim().min(2), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), type: z.enum(["Présence", "Enfants", "École", "Repas", "Autre"]) });

export async function createScheduleEventAction(input: unknown) {
  const parsed = scheduleInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Les informations de l'événement sont invalides." };
  const admin = await requireFamilyAdmin();
  const event = await prismaFamilyRepository.createScheduleEvent(admin.familyId, parsed.data);
  revalidatePath("/schedule");
  revalidatePath("/");
  return { ok: true as const, event };
}

export async function deleteScheduleEventAction(eventId: string) {
  const admin = await requireFamilyAdmin();
  await prisma.schedule.deleteMany({ where: { id: eventId, familyId: admin.familyId } });
  revalidatePath("/schedule");
  revalidatePath("/");
  return { ok: true as const };
}

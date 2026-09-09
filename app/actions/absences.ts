"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireFamilyAdmin, requireUser } from "@/lib/auth/guard";

export type AbsenceActionState = { ok: boolean; error?: string };

const requestSchema = z.object({
  type: z.enum(["CONGE", "MALADIE", "EXCEPTIONNELLE"]),
  startsOn: z.string().min(1, "Date de début requise."),
  endsOn: z.string().min(1, "Date de fin requise."),
  comment: z.string().trim().max(300).optional(),
});

export async function requestAbsenceAction(_prevState: AbsenceActionState, formData: FormData): Promise<AbsenceActionState> {
  const user = await requireUser();
  if (!user.nannyId) return { ok: false, error: "Seule une employée peut faire une demande d'absence." };

  const parsed = requestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const startsOn = new Date(parsed.data.startsOn);
  const endsOn = new Date(parsed.data.endsOn);
  if (Number.isNaN(startsOn.getTime()) || Number.isNaN(endsOn.getTime()) || endsOn < startsOn) {
    return { ok: false, error: "La date de fin doit suivre la date de début." };
  }

  await prisma.absence.create({
    data: { familyId: user.familyId, nannyId: user.nannyId, type: parsed.data.type, startsOn, endsOn, comment: parsed.data.comment, status: "PENDING" },
  });

  revalidatePath("/");
  revalidatePath("/absences");
  return { ok: true };
}

export async function updateAbsenceStatusAction(absenceId: string, status: "APPROVED" | "REJECTED") {
  const admin = await requireFamilyAdmin();
  await prisma.absence.updateMany({ where: { id: absenceId, familyId: admin.familyId }, data: { status } });
  revalidatePath("/absences");
  revalidatePath("/");
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireFamilyAdmin } from "@/lib/auth/guard";
import { isPayrollDateInPeriod } from "@/lib/payroll/period";

export type PayrollActionState = { ok: boolean; error?: string };

const createAdvanceSchema = z.object({
  nannyId: z.string().min(1, "L'employée est requise."),
  amount: z.coerce.number().positive("Le montant de l'avance doit être supérieur à 0."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date d'avance invalide."),
  payrollMonth: z.string().regex(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/, "Période de paie invalide."),
  notes: z.string().trim().max(300, "La note ne doit pas dépasser 300 caractères.").optional(),
});

/**
 * Enregistre une avance sur salaire pour une nounou.
 * Action réservée aux administrateurs de la famille.
 */
export async function createSalaryAdvanceAction(_prevState: PayrollActionState, formData: FormData): Promise<PayrollActionState> {
  const admin = await requireFamilyAdmin();
  const parsed = createAdvanceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const nanny = await prisma.nanny.findFirst({
    where: { id: parsed.data.nannyId, familyId: admin.familyId },
  });
  if (!nanny) {
    return { ok: false, error: "Employée introuvable pour votre foyer." };
  }

  const year = Number(parsed.data.payrollMonth.slice(0, 4));
  const month = Number(parsed.data.payrollMonth.slice(5, 7));
  const payrollMonth = new Date(year, month - 1, 1);
  if (!isPayrollDateInPeriod(parsed.data.date, payrollMonth, nanny.startDate)) {
    return { ok: false, error: "La date est invalide ou ne fait pas partie de la période de paie affichée." };
  }
  const advanceDate = new Date(`${parsed.data.date}T00:00:00`);

  await prisma.salaryAdvance.create({
    data: {
      familyId: admin.familyId,
      nannyId: nanny.id,
      amount: parsed.data.amount,
      date: advanceDate,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/payroll");
  revalidatePath("/");
  revalidatePath("/history");
  return { ok: true };
}

/**
 * Supprime une avance sur salaire.
 * Action réservée aux administrateurs de la famille.
 */
export async function deleteSalaryAdvanceAction(advanceId: string): Promise<PayrollActionState> {
  const admin = await requireFamilyAdmin();

  await prisma.salaryAdvance.deleteMany({
    where: { id: advanceId, familyId: admin.familyId },
  });

  revalidatePath("/payroll");
  revalidatePath("/");
  revalidatePath("/history");
  return { ok: true };
}

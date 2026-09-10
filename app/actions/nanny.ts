"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { requireFamilyAdmin } from "@/lib/auth/guard";
import { saveImageUpload, UploadError } from "@/lib/uploads/store";

export type NannyActionState = { ok: boolean; error?: string };

const usernamePattern = /^[a-z0-9](?:[a-z0-9._-]{1,28})[a-z0-9]$/;

const createNannySchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis."),
  lastName: z.string().trim().min(1, "Le nom est requis."),
  username: z.string().trim().toLowerCase().min(3, "L'identifiant doit contenir au moins 3 caractères.").regex(usernamePattern, "Utilisez uniquement lettres, chiffres, points, tirets ou underscores."),
  contactEmail: z.string().trim().toLowerCase().email("Adresse email invalide.").optional().or(z.literal("")),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  startDate: z.string().min(1, "La date de début est requise."),
  weeklyHours: z.coerce.number().positive("Le nombre d'heures doit être positif."),
  monthlySalary: z.coerce.number().nonnegative().optional(),
  hourlyRate: z.coerce.number().nonnegative().optional(),
});

export async function createNannyAccountAction(_prevState: NannyActionState, formData: FormData): Promise<NannyActionState> {
  const admin = await requireFamilyAdmin();
  const parsed = createNannySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const existingUsername = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (existingUsername) return { ok: false, error: "Cet identifiant de connexion est déjà utilisé." };

  const loginEmail = `${parsed.data.username}@employe.maison-douce.local`;

  await prisma.$transaction(async (tx) => {
    const nanny = await tx.nanny.create({
      data: {
        familyId: admin.familyId,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.contactEmail || null,
        startDate: new Date(parsed.data.startDate),
        weeklyHours: parsed.data.weeklyHours,
        monthlySalary: parsed.data.monthlySalary,
        hourlyRate: parsed.data.hourlyRate,
        workDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
      },
    });
    const user = await tx.user.create({
      data: {
        email: loginEmail,
        username: parsed.data.username,
        name: `${parsed.data.firstName} ${parsed.data.lastName}`,
        role: "NANNY",
        passwordHash: hashPassword(parsed.data.password),
      },
    });
    await tx.nanny.update({ where: { id: nanny.id }, data: { userId: user.id } });
  });

  revalidatePath("/nanny");
  return { ok: true };
}


const updateRateSchema = z.object({
  nannyId: z.string().min(1),
  startDate: z.string().min(1, "La date de début est requise."),
  weeklyHours: z.coerce.number().positive("Le nombre d'heures doit être positif."),
  monthlySalary: z.coerce.number().nonnegative().optional(),
  hourlyRate: z.coerce.number().nonnegative().optional(),
});

export async function updateNannyRateAction(_prevState: NannyActionState, formData: FormData): Promise<NannyActionState> {
  const admin = await requireFamilyAdmin();
  const parsed = updateRateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Valeurs invalides." };

  const nanny = await prisma.nanny.findFirst({ where: { id: parsed.data.nannyId, familyId: admin.familyId } });
  if (!nanny) return { ok: false, error: "Employée introuvable." };

  await prisma.nanny.update({
    where: { id: nanny.id },
    data: { startDate: new Date(parsed.data.startDate), weeklyHours: parsed.data.weeklyHours, monthlySalary: parsed.data.monthlySalary, hourlyRate: parsed.data.hourlyRate },
  });

  revalidatePath("/nanny");
  revalidatePath("/payroll");
  revalidatePath("/timesheet");
  return { ok: true };
}

const profileSchema = z.object({
  nannyId: z.string().min(1),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  idDocument: z.string().trim().max(60).optional().or(z.literal("")),
  contactEmail: z.string().trim().toLowerCase().email("Adresse email invalide.").optional().or(z.literal("")),
});

export async function updateNannyProfileAction(_prevState: NannyActionState, formData: FormData): Promise<NannyActionState> {
  const admin = await requireFamilyAdmin();
  const { photo, ...fields } = Object.fromEntries(formData) as Record<string, FormDataEntryValue>;
  const parsed = profileSchema.safeParse(fields);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const nanny = await prisma.nanny.findFirst({ where: { id: parsed.data.nannyId, familyId: admin.familyId } });
  if (!nanny) return { ok: false, error: "Employée introuvable." };

  let photoUrl: string | null = null;
  try {
    photoUrl = await saveImageUpload(photo ?? null, "nannies");
  } catch (error) {
    return { ok: false, error: error instanceof UploadError ? error.message : "Échec de l'envoi de la photo." };
  }

  await prisma.nanny.update({
    where: { id: nanny.id },
    data: {
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      idDocument: parsed.data.idDocument || null,
      email: parsed.data.contactEmail || null,
      ...(photoUrl ? { photoUrl } : {}),
    },
  });

  revalidatePath("/nanny");
  revalidatePath("/profile");
  return { ok: true };
}

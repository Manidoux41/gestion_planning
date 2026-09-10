"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireFamilyAdmin, requireUser } from "@/lib/auth/guard";
import { sanitizePhotoUrl, UploadError } from "@/lib/uploads/store";
import type { Locale } from "@/lib/i18n";

const allowedLocales: Locale[] = ["FR", "EN", "KM"];

export async function updateLanguageAction(formData: FormData) {
  const user = await requireUser();
  const language = formData.get("language");
  if (typeof language !== "string" || !allowedLocales.includes(language as Locale)) return;
  await prisma.family.update({ where: { id: user.familyId }, data: { language: language as Locale } });
  revalidatePath("/", "layout");
}

export type FamilyProfileState = { ok: boolean; error?: string };

const familyProfileSchema = z.object({
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  idDocument: z.string().trim().max(60).optional().or(z.literal("")),
  latitude: z.coerce.number().min(-90, "Latitude invalide.").max(90, "Latitude invalide.").optional(),
  longitude: z.coerce.number().min(-180, "Longitude invalide.").max(180, "Longitude invalide.").optional(),
});

export async function updateFamilyProfileAction(_prevState: FamilyProfileState, formData: FormData): Promise<FamilyProfileState> {
  const admin = await requireFamilyAdmin();
  const { photoUrl: rawPhotoUrl, latitude, longitude, ...rest } = Object.fromEntries(formData) as Record<string, FormDataEntryValue>;
  const parsed = familyProfileSchema.safeParse({
    ...rest,
    latitude: latitude === "" ? undefined : latitude,
    longitude: longitude === "" ? undefined : longitude,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  let photoUrl: string | null = null;
  try {
    photoUrl = sanitizePhotoUrl(rawPhotoUrl ?? null);
  } catch (error) {
    return { ok: false, error: error instanceof UploadError ? error.message : "Échec de l'envoi de la photo." };
  }

  await prisma.family.update({
    where: { id: admin.familyId },
    data: {
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      idDocument: parsed.data.idDocument || null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      ...(photoUrl ? { photoUrl } : {}),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/profile");
  return { ok: true };
}


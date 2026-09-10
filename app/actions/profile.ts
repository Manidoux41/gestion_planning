"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/guard";
import { saveImageUpload, UploadError } from "@/lib/uploads/store";

export type OwnProfileState = { ok: boolean; error?: string };

const ownProfileSchema = z.object({
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  idDocument: z.string().trim().max(60).optional().or(z.literal("")),
});

/** Permet à l'employée de compléter elle-même son profil et d'envoyer sa photo. */
export async function updateOwnNannyProfileAction(_prevState: OwnProfileState, formData: FormData): Promise<OwnProfileState> {
  const user = await requireUser();
  if (user.role !== "NANNY" || !user.nannyId) return { ok: false, error: "Profil indisponible." };

  const { photo, ...fields } = Object.fromEntries(formData) as Record<string, FormDataEntryValue>;
  const parsed = ownProfileSchema.safeParse(fields);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  let photoUrl: string | null = null;
  try {
    photoUrl = await saveImageUpload(photo ?? null, "nannies");
  } catch (error) {
    return { ok: false, error: error instanceof UploadError ? error.message : "Échec de l'envoi de la photo." };
  }

  await prisma.nanny.update({
    where: { id: user.nannyId },
    data: {
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      idDocument: parsed.data.idDocument || null,
      ...(photoUrl ? { photoUrl } : {}),
    },
  });

  revalidatePath("/profile");
  revalidatePath("/nanny");
  return { ok: true };
}

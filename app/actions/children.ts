"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireFamilyAdmin } from "@/lib/auth/guard";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";
import { sanitizePhotoUrl, UploadError } from "@/lib/uploads/store";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const optionalTime = z.string().trim().regex(timePattern, "Heure invalide.").optional().or(z.literal(""));

const childInput = z.object({
  name: z.string().trim().min(2),
  school: z.string().trim().max(120).optional(),
  birthDate: z.string().trim().optional().or(z.literal("")),
  schoolStartTime: optionalTime,
  schoolEndTime: optionalTime,
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function createChildAction(input: unknown) {
  const parsed = childInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Les informations de l'enfant sont invalides." };
  const admin = await requireFamilyAdmin();
  const child = await prismaFamilyRepository.createChild(admin.familyId, {
    name: parsed.data.name,
    age: 0,
    birthDate: parsed.data.birthDate || null,
    school: parsed.data.school || "À préciser",
    schoolStartTime: parsed.data.schoolStartTime || null,
    schoolEndTime: parsed.data.schoolEndTime || null,
    notes: parsed.data.notes || null,
    color: "sage",
    photoUrl: null,
    initials: parsed.data.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
  });
  revalidatePath("/children");
  return { ok: true as const, child };
}

export async function updateChildAction(childId: string, input: unknown) {
  const parsed = childInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Les informations de l'enfant sont invalides." };
  const admin = await requireFamilyAdmin();
  const [firstName = "Enfant", ...lastNameParts] = parsed.data.name.trim().split(/\s+/);
  const updated = await prisma.child.updateMany({
    where: { id: childId, familyId: admin.familyId },
    data: {
      firstName,
      lastName: lastNameParts.join(" ") || null,
      school: parsed.data.school || null,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      schoolStartTime: parsed.data.schoolStartTime || null,
      schoolEndTime: parsed.data.schoolEndTime || null,
      notes: parsed.data.notes || null,
    },
  });
  if (updated.count === 0) return { ok: false as const, error: "Enfant introuvable." };
  revalidatePath("/children");
  return { ok: true as const };
}

export async function deleteChildAction(childId: string) {
  const admin = await requireFamilyAdmin();
  await prisma.child.deleteMany({ where: { id: childId, familyId: admin.familyId } });
  revalidatePath("/children");
  return { ok: true as const };
}

export type ChildPhotoState = { ok: boolean; error?: string; childId?: string; photoUrl?: string };

export async function updateChildPhotoAction(_prevState: ChildPhotoState, formData: FormData): Promise<ChildPhotoState> {
  const admin = await requireFamilyAdmin();
  const childId = formData.get("childId");
  if (typeof childId !== "string" || !childId) return { ok: false, error: "Enfant introuvable." };

  const child = await prisma.child.findFirst({ where: { id: childId, familyId: admin.familyId } });
  if (!child) return { ok: false, error: "Enfant introuvable." };

  let photoUrl: string | null = null;
  try {
    photoUrl = sanitizePhotoUrl(formData.get("photoUrl"));
  } catch (error) {
    return { ok: false, error: error instanceof UploadError ? error.message : "Échec de l'envoi de la photo." };
  }
  if (!photoUrl) return { ok: false, error: "Choisissez une photo à envoyer." };

  await prisma.child.update({ where: { id: child.id }, data: { photoUrl } });
  revalidatePath("/children");
  return { ok: true, childId: child.id, photoUrl };
}


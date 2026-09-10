"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireFamilyAdmin } from "@/lib/auth/guard";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";
import { sanitizePhotoUrl, UploadError } from "@/lib/uploads/store";

const childInput = z.object({ name: z.string().trim().min(2), school: z.string().trim().max(120).optional(), age: z.coerce.number().int().min(0).max(18) });

export async function createChildAction(input: unknown) {
  const parsed = childInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Les informations de l'enfant sont invalides." };
  const admin = await requireFamilyAdmin();
  const child = await prismaFamilyRepository.createChild(admin.familyId, { name: parsed.data.name, age: parsed.data.age, school: parsed.data.school ?? "À préciser", color: "sage", photoUrl: null, initials: parsed.data.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() });
  revalidatePath("/children");
  return { ok: true as const, child };
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


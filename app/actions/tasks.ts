"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireFamilyAdmin, requireUser } from "@/lib/auth/guard";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";

const taskInput = z.object({ title: z.string().trim().min(2), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), child: z.string().trim().min(1), category: z.enum(["Enfants", "École", "Repas", "Maison", "Courses", "Hygiène", "Administratif", "Autre"]), priority: z.enum(["Normale", "Important"]) });

export async function createTaskAction(input: unknown) {
  const parsed = taskInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Les informations de la tâche sont invalides." };
  const admin = await requireFamilyAdmin();
  const task = await prismaFamilyRepository.createTask(admin.familyId, { ...parsed.data, done: false });
  revalidatePath("/tasks");
  revalidatePath("/");
  return { ok: true as const, task };
}

export async function toggleTaskDoneAction(taskId: string, done: boolean) {
  const user = await requireUser();
  const result = await prisma.task.updateMany({ where: { id: taskId, familyId: user.familyId }, data: { status: done ? "DONE" : "TODO" } });
  if (result.count === 0) return { ok: false as const, error: "Tâche introuvable." };
  revalidatePath("/tasks");
  revalidatePath("/");
  return { ok: true as const };
}

export async function deleteTaskAction(taskId: string) {
  const admin = await requireFamilyAdmin();
  await prisma.task.deleteMany({ where: { id: taskId, familyId: admin.familyId } });
  revalidatePath("/tasks");
  revalidatePath("/");
  return { ok: true as const };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireFamilyAdmin, requireUser } from "@/lib/auth/guard";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";

const taskInput = z.object({
  title: z.string().trim().min(2),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure de début invalide."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure de fin invalide."),
  child: z.string().trim().min(1),
  category: z.enum(["Enfants", "École", "Repas", "Maison", "Courses", "Hygiène", "Administratif", "Autre"]),
  priority: z.enum(["Normale", "Important"]),
}).refine((data) => data.endTime > data.time, { message: "L'heure de fin doit être après l'heure de début.", path: ["endTime"] });

export async function createTaskAction(input: unknown) {
  const parsed = taskInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Les informations de la tâche sont invalides." };
  const admin = await requireFamilyAdmin();
  const task = await prismaFamilyRepository.createTask(admin.familyId, { ...parsed.data, done: false });
  revalidatePath("/tasks");
  revalidatePath("/schedule");
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

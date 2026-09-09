"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDemoFamilyContext } from "@/lib/db/demo-context";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";

const taskInput = z.object({ title: z.string().trim().min(2), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), child: z.string().trim().min(1), category: z.enum(["Enfants", "École", "Repas", "Maison", "Courses", "Hygiène", "Administratif", "Autre"]), priority: z.enum(["Normale", "Important"]) });

export async function createTaskAction(input: unknown) {
  const parsed = taskInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Les informations de la tâche sont invalides." };
  const { family } = await getDemoFamilyContext();
  const task = await prismaFamilyRepository.createTask(family.id, { ...parsed.data, done: false });
  revalidatePath("/tasks");
  revalidatePath("/");
  return { ok: true as const, task };
}

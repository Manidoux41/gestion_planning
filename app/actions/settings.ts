"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/guard";
import type { Locale } from "@/lib/i18n";

const allowedLocales: Locale[] = ["FR", "EN", "KM"];

export async function updateLanguageAction(formData: FormData) {
  const user = await requireUser();
  const language = formData.get("language");
  if (typeof language !== "string" || !allowedLocales.includes(language as Locale)) return;
  await prisma.family.update({ where: { id: user.familyId }, data: { language: language as Locale } });
  revalidatePath("/", "layout");
}

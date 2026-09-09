import { z } from "zod";

export const taskSchema = z.object({ title: z.string().trim().min(2, "Le titre doit contenir au moins 2 caractères."), time: z.string().min(1, "Choisissez une heure."), child: z.string().min(1, "Choisissez un enfant."), category: z.string().min(1, "Choisissez une catégorie.") });
export const nannySchema = z.object({ name: z.string().trim().min(2, "Le nom est obligatoire."), email: z.string().email("Adresse email invalide."), phone: z.string().min(8, "Numéro de téléphone invalide."), monthlySalary: z.coerce.number().positive("Le salaire doit être positif."), weeklyHours: z.coerce.number().positive("Le nombre d'heures doit être positif.") });
export type TaskForm = z.infer<typeof taskSchema>;
export type NannyForm = z.infer<typeof nannySchema>;

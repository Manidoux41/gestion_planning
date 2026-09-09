import { prisma } from "./prisma";

const demoUser = {
  email: "amelie.martin@example.com",
  name: "Amélie Martin",
};

export async function getDemoFamilyContext() {
  const user = await prisma.user.upsert({
    where: { email: demoUser.email },
    update: { name: demoUser.name },
    create: { email: demoUser.email, name: demoUser.name },
    include: { families: true },
  });

  const family = user.families[0] ?? await prisma.family.create({
    data: {
      ownerId: user.id,
      name: "Famille Martin",
      address: "12 rue des Lilas, 75011 Paris",
      phone: "+33 6 12 34 56 78",
      currency: "USD",
    },
  });

  const nanny = await prisma.nanny.findFirst({ where: { familyId: family.id }, orderBy: { createdAt: "asc" } })
    ?? await prisma.nanny.create({ data: { familyId: family.id, firstName: "Boneth", lastName: "Deap", weeklyHours: 35, monthlySalary: 330, workDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] } });

  if (await prisma.child.count({ where: { familyId: family.id } }) === 0) {
    await prisma.child.createMany({ data: [
      { familyId: family.id, firstName: "Loukas", lastName: "Martin", school: "École des Lilas" },
      { familyId: family.id, firstName: "Illyana", lastName: "Martin", school: "École des Lilas" },
    ] });
  }
  if (await prisma.task.count({ where: { familyId: family.id } }) === 0) {
    await prisma.task.createMany({ data: [
      { familyId: family.id, title: "Récupérer Loukas à l'école", category: "École", priority: "IMPORTANT", dueAt: new Date("2026-09-09T15:30:00") },
      { familyId: family.id, title: "Préparer le goûter", category: "Repas", priority: "NORMALE", status: "DONE", dueAt: new Date("2026-09-09T16:00:00") },
      { familyId: family.id, title: "Vérifier les devoirs", category: "Enfants", priority: "NORMALE", dueAt: new Date("2026-09-09T17:00:00") },
    ] });
  }
  if (await prisma.schedule.count({ where: { familyId: family.id } }) === 0) {
    await prisma.schedule.createMany({ data: [
      { familyId: family.id, title: "Arrivée de Boneth", type: "Présence", startsAt: new Date("2026-09-09T08:00:00") },
      { familyId: family.id, title: "Préparer les enfants", type: "Enfants", startsAt: new Date("2026-09-09T08:30:00") },
      { familyId: family.id, title: "Récupérer Loukas à l'école", type: "École", startsAt: new Date("2026-09-09T15:30:00") },
      { familyId: family.id, title: "Goûter et devoirs", type: "Repas", startsAt: new Date("2026-09-09T16:00:00") },
    ] });
  }

  return { user, family, nanny };
}

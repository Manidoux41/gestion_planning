import { AppShell } from "@/components/layout/app-shell";
import { mockChildren, mockTasks } from "@/lib/db";
import { TasksManager } from "@/components/tasks/tasks-manager";
import { requireUser } from "@/lib/auth/guard";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";
import { translator } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function TasksPage() {
  const user = await requireUser();
  const t = translator(user.language);
  const [tasks, children] = await Promise.all([prismaFamilyRepository.listTasks(user.familyId), prismaFamilyRepository.listChildren(user.familyId)]);
  return <AppShell activePath="/tasks" user={user}><div className="content-wrap app-page"><div className="page-heading"><div><p className="eyebrow">Organisation quotidienne</p><h1>{t("tasks.title")}</h1><p className="page-subtitle">{t("tasks.subtitle")}</p></div></div><TasksManager initialTasks={tasks.length ? tasks : mockTasks} childOptions={children.length ? children : mockChildren} canEdit={user.role !== "NANNY"} /></div></AppShell>;
}

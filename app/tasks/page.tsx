import { AppShell } from "@/components/layout/app-shell";
import { mockChildren, mockTasks } from "@/lib/db";
import { TasksManager } from "@/components/tasks/tasks-manager";
import { getDemoFamilyContext } from "@/lib/db/demo-context";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function TasksPage() {
  const { family } = await getDemoFamilyContext();
  const [tasks, children] = await Promise.all([prismaFamilyRepository.listTasks(family.id), prismaFamilyRepository.listChildren(family.id)]);
  return <AppShell activePath="/tasks"><div className="content-wrap app-page"><div className="page-heading"><div><p className="eyebrow">Organisation quotidienne</p><h1>Les tâches</h1><p className="page-subtitle">Retrouvez tout ce qui rythme la journée des enfants.</p></div></div><TasksManager initialTasks={tasks.length ? tasks : mockTasks} childOptions={children.length ? children : mockChildren} /></div></AppShell>;
}

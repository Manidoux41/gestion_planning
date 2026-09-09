import { AppShell } from "@/components/layout/app-shell";
import { ScheduleManager } from "@/components/schedule/schedule-manager";
import type { ScheduleEvent } from "@/lib/db";
import { requireUser } from "@/lib/auth/guard";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";
import { translator } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const events: ScheduleEvent[] = [{ id: "event-1", date: "2026-09-09", time: "08:00", title: "Arrivée de Boneth", type: "Présence" }, { id: "event-2", date: "2026-09-09", time: "08:30", title: "Préparer les enfants", type: "Enfants" }, { id: "event-3", date: "2026-09-09", time: "15:30", title: "Récupérer Loukas à l'école", type: "École" }, { id: "event-4", date: "2026-09-09", time: "16:00", title: "Goûter et devoirs", type: "Repas" }, { id: "event-5", date: "2026-09-09", time: "18:00", title: "Fin de journée", type: "Présence" }];

export default async function SchedulePage() {
  const user = await requireUser();
  const t = translator(user.language);
  const [storedEvents, tasks] = await Promise.all([
    prismaFamilyRepository.listScheduleEvents(user.familyId),
    prismaFamilyRepository.listTasks(user.familyId),
  ]);
  return <AppShell activePath="/schedule" user={user}><div className="content-wrap app-page"><div className="page-heading"><div><p className="eyebrow">Organisation familiale</p><h1>{t("schedule.title")}</h1><p className="page-subtitle">{t("schedule.subtitle")}</p></div></div><ScheduleManager initialEvents={storedEvents.length ? storedEvents : events} initialTasks={tasks} canEdit={user.role !== "NANNY"} /></div></AppShell>;
}


import { AppShell } from "@/components/layout/app-shell";
import { ScheduleManager } from "@/components/schedule/schedule-manager";
import type { ScheduleEvent } from "@/lib/db";
import { getDemoFamilyContext } from "@/lib/db/demo-context";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";

const events: ScheduleEvent[] = [{ id: "event-1", time: "08:00", title: "Arrivée de Boneth", type: "Présence" }, { id: "event-2", time: "08:30", title: "Préparer les enfants", type: "Enfants" }, { id: "event-3", time: "15:30", title: "Récupérer Loukas à l'école", type: "École" }, { id: "event-4", time: "16:00", title: "Goûter et devoirs", type: "Repas" }, { id: "event-5", time: "18:00", title: "Fin de journée", type: "Présence" }];

export default async function SchedulePage() {
  const { family } = await getDemoFamilyContext();
  const storedEvents = await prismaFamilyRepository.listScheduleEvents(family.id);
  return <AppShell activePath="/schedule"><div className="content-wrap app-page"><div className="page-heading"><div><p className="eyebrow">Organisation familiale</p><h1>Le planning</h1><p className="page-subtitle">Une vue claire des moments importants de la journée.</p></div></div><ScheduleManager initialEvents={storedEvents.length ? storedEvents : events} /></div></AppShell>;
}

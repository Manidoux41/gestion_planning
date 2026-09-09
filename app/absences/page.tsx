import { CalendarOff, Check, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { requireFamilyAdmin } from "@/lib/auth/guard";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";
import { updateAbsenceStatusAction } from "@/app/actions/absences";
import { translator } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AbsencesPage() {
  const user = await requireFamilyAdmin();
  const t = translator(user.language);
  const absences = await prismaFamilyRepository.listAbsences(user.familyId);
  return <AppShell activePath="/settings" user={user}><div className="content-wrap app-page"><div className="page-heading"><div><p className="eyebrow">Calendrier du travail</p><h1>{t("absences.title")}</h1><p className="page-subtitle">{t("absences.subtitle")}</p></div></div><section className="absence-list">{absences.map((absence) => <article className="absence-row" key={absence.id}><span className="settings-icon"><CalendarOff size={18} /></span><div><b>{absence.type}</b><small>{absence.person} · {absence.duration}</small></div><strong>{absence.date}</strong><em>{absence.status}</em>{absence.status === "Planifiée" && <span style={{ display: "flex", gap: 6 }}><form action={updateAbsenceStatusAction.bind(null, absence.id, "APPROVED")}><button type="submit" className="more-button" aria-label="Approuver"><Check size={16} color="#4e7b68" /></button></form><form action={updateAbsenceStatusAction.bind(null, absence.id, "REJECTED")}><button type="submit" className="more-button" aria-label="Refuser"><X size={16} color="#b3543d" /></button></form></span>}</article>)}{absences.length === 0 && <p className="page-subtitle">Aucune absence enregistrée pour le moment.</p>}</section></div></AppShell>;
}


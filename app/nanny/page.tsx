import { Mail, MapPin, Pencil, Phone, Save } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { mockNanny } from "@/lib/db";
import { getDemoFamilyContext } from "@/lib/db/demo-context";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function NannyPage() {
  const { family } = await getDemoFamilyContext();
  const nanny = await prismaFamilyRepository.getNanny(family.id) ?? mockNanny;
  return <AppShell activePath="/nanny"><div className="content-wrap app-page"><div className="page-heading"><div><p className="eyebrow">Équipe de la famille</p><h1>La nounou</h1><p className="page-subtitle">Le profil et les conditions de travail de votre nounou.</p></div><button className="outline-button"><Pencil size={15} /> Modifier</button></div><section className="profile-card"><div className="large-avatar">BD</div><div className="profile-card-info"><span className="status-pill"><span /> Contrat actif</span><h2>{nanny.name}</h2><p>{nanny.role} · depuis le {nanny.startDate}</p><div className="contact-grid"><span><Phone size={14} /> {nanny.phone}</span><span><Mail size={14} /> {nanny.email}</span><span><MapPin size={14} /> Paris, France</span></div></div></section><section className="settings-section"><div className="section-heading"><div><p className="eyebrow">Conditions</p><h2>Informations contractuelles</h2></div><Save size={18} color="#7d9d87" /></div><div className="detail-grid"><div><small>Salaire mensuel</small><strong>{nanny.monthlySalary} $ / mois</strong></div><div><small>Heures prévues</small><strong>{nanny.weeklyHours}h / semaine</strong></div><div><small>Équivalent horaire</small><strong>{(nanny.monthlySalary / (nanny.weeklyHours * 52 / 12)).toFixed(2)} $ / heure</strong></div><div><small>Horaires habituels</small><strong>08:00 - 15:00</strong></div></div></section></div></AppShell>;
}

import Link from "next/link";
import { CalendarDays, Check, ChevronRight, Clock3, FileText, Home, Settings, Sparkles, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/mock-user";

const navigation = [
  { label: "Tableau de bord", href: "/", icon: Home },
  { label: "Planning", href: "/schedule", icon: CalendarDays },
  { label: "Heures", href: "/timesheet", icon: Clock3 },
  { label: "Tâches", href: "/tasks", icon: Check },
  { label: "Enfants", href: "/children", icon: Users },
  { label: "Nounou", href: "/nanny", icon: Users },
  { label: "Paie", href: "/payroll", icon: FileText },
];

export function AppShell({ children, activePath }: { children: React.ReactNode; activePath: string }) {
  const user = getCurrentUser();
  return <div className="app-shell"><aside className="sidebar"><Link className="brand-mark" href="/"><Sparkles size={17} fill="currentColor" /><span>Maison douce</span></Link><div className="workspace-switcher"><span className="family-avatar">M</span><span><b>{user.familyName}</b><small>Espace familial</small></span><ChevronRight size={15} /></div><nav className="main-nav" aria-label="Navigation principale"><p className="nav-label">Gestion</p>{navigation.map((item) => { const Icon = item.icon; return <Link className={`nav-link ${activePath === item.href ? "active" : ""}`} href={item.href} key={item.href}><Icon size={18} strokeWidth={activePath === item.href ? 2.2 : 1.8} /><span>{item.label}</span>{activePath === item.href && <span className="active-dot" />}</Link>; })}<p className="nav-label nav-label-spaced">Compte</p><Link className={`nav-link ${activePath === "/settings" ? "active" : ""}`} href="/settings"><Settings size={18} /><span>Paramètres</span></Link></nav><div className="sidebar-footer"><div className="help-icon">?</div><div><b>Besoin d&apos;aide ?</b><small>Notre équipe est là</small></div><ChevronRight size={15} /></div></aside><main className="dashboard-main"><header className="topbar"><div className="breadcrumb"><Link href="/">Maison douce</Link><ChevronRight size={14} /> <span>{navigation.find((item) => item.href === activePath)?.label ?? "Paramètres"}</span></div><div className="topbar-actions"><span className="mock-mode">Mode démo</span><div className="profile-avatar">{user.initials}</div></div></header>{children}</main><nav className="mobile-nav" aria-label="Navigation mobile">{navigation.slice(0, 5).map((item) => { const Icon = item.icon; return <Link className={activePath === item.href ? "active" : ""} href={item.href} key={item.href}><Icon size={19} /><span>{item.label === "Tableau de bord" ? "Accueil" : item.label}</span></Link>; })}</nav></div>;
}

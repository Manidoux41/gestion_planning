import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Check, ChevronRight, Clock3, FileText, Home, LogOut, Settings, Sparkles, UserRound, Users } from "lucide-react";
import type { SessionUser } from "@/lib/auth/session";
import { logoutAction } from "@/app/actions/auth";
import { translator } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/settings/language-switcher";
import { MobileAccountMenu } from "@/components/layout/mobile-account-menu";

function getNavigation(t: (key: string) => string) {
  const admin = [
    { label: t("nav.dashboard"), href: "/", icon: Home },
    { label: t("nav.schedule"), href: "/schedule", icon: CalendarDays },
    { label: t("nav.timesheet"), href: "/timesheet", icon: Clock3 },
    { label: t("nav.tasks"), href: "/tasks", icon: Check },
    { label: t("nav.children"), href: "/children", icon: Users },
    { label: t("nav.nanny"), href: "/nanny", icon: Users },
    { label: t("nav.payroll"), href: "/payroll", icon: FileText },
  ];
  const nanny = [
    { label: t("nav.dashboard"), href: "/", icon: Home },
    { label: t("nav.schedule"), href: "/schedule", icon: CalendarDays },
    { label: t("nav.timesheet"), href: "/timesheet", icon: Clock3 },
    { label: t("nav.tasks"), href: "/tasks", icon: Check },
    { label: t("nav.profile"), href: "/profile", icon: UserRound },
  ];
  return { admin, nanny };
}

export function AppShell({ children, activePath, user }: { children: React.ReactNode; activePath: string; user: SessionUser }) {
  const t = translator(user.language);
  const { admin, nanny } = getNavigation(t);
  const navigation = user.role === "NANNY" ? nanny : admin;
  return <div className="app-shell"><aside className="sidebar"><Link className="brand-mark" href="/"><Sparkles size={17} fill="currentColor" /><span>Maison douce</span></Link><Link className="workspace-switcher" href="/family">{user.familyPhotoUrl ? <Image className="family-avatar avatar-photo" src={user.familyPhotoUrl} alt={user.familyName} width={28} height={28} unoptimized /> : <span className="family-avatar">{user.familyName.charAt(0)}</span>}<span><b>{user.familyName}</b><small>{user.role === "NANNY" ? t("shell.employeeSpace") : t("shell.familySpace")}</small></span><ChevronRight size={15} /></Link><nav className="main-nav" aria-label="Navigation principale"><p className="nav-label">{t("nav.management")}</p>{navigation.map((item) => { const Icon = item.icon; return <Link className={`nav-link ${activePath === item.href ? "active" : ""}`} href={item.href} key={item.href}><Icon size={18} strokeWidth={activePath === item.href ? 2.2 : 1.8} /><span>{item.label}</span>{activePath === item.href && <span className="active-dot" />}</Link>; })}{user.role !== "NANNY" && <><p className="nav-label nav-label-spaced">{t("nav.account")}</p><Link className={`nav-link ${activePath === "/settings" ? "active" : ""}`} href="/settings"><Settings size={18} /><span>{t("nav.settings")}</span></Link></>}</nav><div className="sidebar-footer"><LanguageSwitcher language={user.language} labels={{ french: t("settings.french"), english: t("settings.english"), khmer: t("settings.khmer") }} /><form action={logoutAction} style={{ width: "100%" }}><button className="nav-link" type="submit" style={{ width: "100%", border: 0, background: "none", cursor: "pointer" }}><LogOut size={18} /><span>{t("shell.logout")}</span></button></form></div></aside><main className="dashboard-main"><header className="topbar"><div className="breadcrumb"><Link href="/">Maison douce</Link><ChevronRight size={14} /> <span>{navigation.find((item) => item.href === activePath)?.label ?? t("nav.settings")}</span></div><div className="topbar-actions"><span className="mock-mode">{user.name}</span><MobileAccountMenu isAdmin={user.role !== "NANNY"} language={user.language} settingsLabel={t("nav.settings")} logoutLabel={t("shell.logout")} labels={{ french: t("settings.french"), english: t("settings.english"), khmer: t("settings.khmer") }} /><div className="profile-avatar">{user.initials}</div></div></header>{children}</main><nav className="mobile-nav" aria-label="Navigation mobile">{navigation.slice(0, 5).map((item) => { const Icon = item.icon; return <Link className={activePath === item.href ? "active" : ""} href={item.href} key={item.href}><Icon size={19} /><span>{item.label === "Tableau de bord" ? "Accueil" : item.label}</span></Link>; })}</nav></div>;
}


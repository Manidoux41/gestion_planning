import { redirect } from "next/navigation";
import { Sparkles, UserPlus } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  return <main className="auth-page"><section className="auth-card"><div className="brand-mark"><Sparkles size={17} fill="currentColor" /><span>Maison douce</span></div><div className="auth-icon"><UserPlus size={20} /></div><p className="eyebrow">Nouvel espace familial</p><h1>Créer votre espace</h1><p className="page-subtitle">Enregistrez votre famille pour commencer à organiser votre nounou.</p><RegisterForm /></section></main>;
}

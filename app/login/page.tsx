import { redirect } from "next/navigation";
import { LockKeyhole, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  return <main className="auth-page"><section className="auth-card"><div className="brand-mark"><Sparkles size={17} fill="currentColor" /><span>Maison douce</span></div><div className="auth-icon"><LockKeyhole size={20} /></div><p className="eyebrow">Espace familial</p><h1>Bon retour</h1><p className="page-subtitle">Connectez-vous pour retrouver votre organisation.</p><LoginForm /></section></main>;
}


import Link from "next/link";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { mockUser } from "@/lib/auth/mock-user";

export default function LoginPage() {
  return <main className="auth-page"><section className="auth-card"><div className="brand-mark"><Sparkles size={17} fill="currentColor" /><span>Maison douce</span></div><div className="auth-icon"><LockKeyhole size={20} /></div><p className="eyebrow">Espace familial</p><h1>Bienvenue, {mockUser.name.split(" ")[0]}</h1><p className="page-subtitle">Connectez-vous pour retrouver votre organisation.</p><form className="auth-form"><label>Email<input type="email" defaultValue={mockUser.email} /></label><label>Mot de passe<input type="password" defaultValue="demo-password" /></label><Link className="primary-button" href="/">Ouvrir mon espace <ArrowRight size={17} /></Link></form><small className="demo-note">Compte de démonstration prérempli. Aucune donnée n&apos;est enregistrée.</small></section></main>;
}

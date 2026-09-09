"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { loginAction, type AuthActionState } from "@/app/actions/auth";

const initialState: AuthActionState = { ok: false };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  return <form className="auth-form" action={formAction}>
    <label>Identifiant (email ou nom d&apos;utilisateur)<input type="text" name="identifier" required autoComplete="username" placeholder="vous@exemple.com" /></label>
    <label>Mot de passe<input type="password" name="password" required autoComplete="current-password" /></label>
    {state.error && <p className="form-error">{state.error}</p>}
    <button className="primary-button" type="submit" disabled={isPending}>{isPending ? "Connexion..." : <>Ouvrir mon espace <ArrowRight size={17} /></>}</button>
    <small className="demo-note">Pas encore de compte famille ? <Link href="/register">Créer un espace familial</Link>.</small>
  </form>;
}

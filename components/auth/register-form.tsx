"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { registerFamilyAction, type AuthActionState } from "@/app/actions/auth";

const initialState: AuthActionState = { ok: false };

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerFamilyAction, initialState);
  return <form className="auth-form" action={formAction}>
    <label>Nom de la famille<input name="familyName" required placeholder="Famille Martin" /></label>
    <label>Votre nom<input name="name" required placeholder="Amélie Martin" autoComplete="name" /></label>
    <label>Email<input type="email" name="email" required autoComplete="email" placeholder="vous@exemple.com" /></label>
    <label>Mot de passe<input type="password" name="password" required minLength={8} autoComplete="new-password" /></label>
    {state.error && <p className="form-error">{state.error}</p>}
    <button className="primary-button" type="submit" disabled={isPending}>{isPending ? "Création..." : <>Créer mon espace familial <ArrowRight size={17} /></>}</button>
    <small className="demo-note">Déjà un compte ? <Link href="/login">Se connecter</Link>.</small>
  </form>;
}

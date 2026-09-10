"use client";

import { useActionState } from "react";
import { updateOwnNannyProfileAction, type OwnProfileState } from "@/app/actions/profile";
import { ProfileAvatar } from "@/components/ui/profile-avatar";

const initialState: OwnProfileState = { ok: false };

export function NannyProfileForm({ name, phone, address, idDocument, photoUrl }: { name: string; phone: string | null; address: string | null; idDocument: string | null; photoUrl: string | null }) {
  const [state, formAction, isPending] = useActionState(updateOwnNannyProfileAction, initialState);

  return (
    <form className="settings-panel" action={formAction}>
      <div className="profile-photo-row">
        <ProfileAvatar photoUrl={photoUrl} initials={name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()} />
        <label style={{ flex: 1 }}>Ma photo de profil (JPG, PNG ou WEBP — 4 Mo max)<input type="file" name="photo" accept="image/jpeg,image/png,image/webp" /></label>
      </div>
      <label>Mon numéro de téléphone<input type="tel" name="phone" placeholder="+855 12 345 678" defaultValue={phone ?? ""} /></label>
      <label>Mon adresse<input name="address" placeholder="Rue, ville, pays" defaultValue={address ?? ""} /></label>
      <label>Mon numéro de carte d&apos;identité ou de passeport<input name="idDocument" placeholder="ID / Passeport" defaultValue={idDocument ?? ""} /></label>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && !state.error && <p className="page-subtitle">Profil mis à jour.</p>}
      <button className="primary-button" type="submit" disabled={isPending}>{isPending ? "Enregistrement..." : "Enregistrer mon profil"}</button>
    </form>
  );
}

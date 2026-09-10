"use client";

import { useActionState } from "react";
import { updateOwnNannyProfileAction, type OwnProfileState } from "@/app/actions/profile";
import { PhotoUploadField } from "@/components/ui/photo-upload-field";

const initialState: OwnProfileState = { ok: false };

export function NannyProfileForm({ name, phone, address, idDocument, photoUrl, blobEnabled }: { name: string; phone: string | null; address: string | null; idDocument: string | null; photoUrl: string | null; blobEnabled: boolean }) {
  const [state, formAction, isPending] = useActionState(updateOwnNannyProfileAction, initialState);

  return (
    <form className="settings-panel" action={formAction}>
      <PhotoUploadField folder="nannies" blobEnabled={blobEnabled} initials={name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()} currentPhotoUrl={photoUrl} label="Ma photo de profil (JPG, PNG ou WEBP — 5 Mo max)" />
      <label>Mon numéro de téléphone<input type="tel" name="phone" placeholder="+855 12 345 678" defaultValue={phone ?? ""} /></label>
      <label>Mon adresse<input name="address" placeholder="Rue, ville, pays" defaultValue={address ?? ""} /></label>
      <label>Mon numéro de carte d&apos;identité ou de passeport<input name="idDocument" placeholder="ID / Passeport" defaultValue={idDocument ?? ""} /></label>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && !state.error && <p className="page-subtitle">Profil mis à jour.</p>}
      <button className="primary-button" type="submit" disabled={isPending}>{isPending ? "Enregistrement..." : "Enregistrer mon profil"}</button>
    </form>
  );
}

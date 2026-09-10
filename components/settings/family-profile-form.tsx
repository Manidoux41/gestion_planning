"use client";

import { useActionState } from "react";
import { MapPin } from "lucide-react";
import { updateFamilyProfileAction, type FamilyProfileState } from "@/app/actions/settings";
import type { Family } from "@/lib/db/domain-types";
import { googleMapsEmbed, googleMapsLink } from "@/lib/utils/maps";
import { PhotoUploadField } from "@/components/ui/photo-upload-field";
import { TelegramCallButton } from "@/components/contact/telegram-call-button";

const initialState: FamilyProfileState = { ok: false };

export function FamilyProfileForm({ family, blobEnabled }: { family: Family; blobEnabled: boolean }) {
  const [state, formAction, isPending] = useActionState(updateFamilyProfileAction, initialState);
  const mapsLink = googleMapsLink(family.address, family.latitude, family.longitude);
  const mapsEmbed = googleMapsEmbed(family.address, family.latitude, family.longitude);

  return (
    <form className="settings-panel" action={formAction}>
      <PhotoUploadField folder="families" blobEnabled={blobEnabled} initials={family.name.slice(0, 2).toUpperCase()} currentPhotoUrl={family.photoUrl} label="Photo de profil de la famille (JPG, PNG ou WEBP — 5 Mo max)" />
      <label>Numéro de téléphone<input type="tel" name="phone" placeholder="+855 12 345 678" defaultValue={family.phone} /></label>
      <label>Adresse du domicile<input name="address" placeholder="Rue, ville, pays" defaultValue={family.address} /></label>
      <label>Numéro de carte d&apos;identité ou de passeport<input name="idDocument" placeholder="ID / Passeport" defaultValue={family.idDocument ?? ""} /></label>
      <div className="form-columns">
        <label>Latitude (optionnel)<input type="number" name="latitude" step="0.000001" min="-90" max="90" defaultValue={family.latitude ?? ""} /></label>
        <label>Longitude (optionnel)<input type="number" name="longitude" step="0.000001" min="-180" max="180" defaultValue={family.longitude ?? ""} /></label>
      </div>
      {state.error && <p className="form-error">{state.error}</p>}
      <div className="card-actions">
        <button className="primary-button" type="submit" disabled={isPending}>{isPending ? "Enregistrement..." : "Enregistrer le profil"}</button>
        {mapsLink && <a className="outline-button" href={mapsLink} target="_blank" rel="noopener noreferrer"><MapPin size={15} /> Voir sur Google Maps</a>}
        <TelegramCallButton phone={family.phone} label="Appeler la famille sur Telegram" />
      </div>
      {mapsEmbed && <iframe className="map-embed" src={mapsEmbed} title="Domicile familial" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />}
    </form>
  );
}

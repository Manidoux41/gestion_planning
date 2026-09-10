"use client";

import { useActionState, useState } from "react";
import { IdCard, KeyRound, Mail, MapPin, Phone, Plus, Settings2, ShieldCheck, ShieldOff, UserCog, X } from "lucide-react";
import type { NannyRecord } from "@/lib/db/domain-types";
import { createNannyAccountAction, updateNannyProfileAction, updateNannyRateAction, type NannyActionState } from "@/app/actions/nanny";
import { toIsoDateTimeLocal } from "@/lib/utils/dates";
import { TelegramCallButton } from "@/components/contact/telegram-call-button";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { PhotoUploadField } from "@/components/ui/photo-upload-field";

const initialState: NannyActionState = { ok: false };

export function NannyManager({ nannies, blobEnabled }: { nannies: NannyRecord[]; blobEnabled: boolean }) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<NannyRecord | null>(null);
  const [profiling, setProfiling] = useState<NannyRecord | null>(null);
  const [createState, createFormAction, isCreating] = useActionState(createNannyAccountAction, initialState);
  const [rateState, rateFormAction, isUpdatingRate] = useActionState(updateNannyRateAction, initialState);
  const [profileState, profileFormAction, isUpdatingProfile] = useActionState(updateNannyProfileAction, initialState);

  return <>
    <div className="schedule-actions"><button type="button" className="primary-button" onClick={() => setCreating(true)}><Plus size={17} /> Créer une employée</button></div>
    <div className="entity-grid">
      {nannies.map((nanny) => <article className="entity-card" key={nanny.id}>
        <ProfileAvatar photoUrl={nanny.photoUrl} initials={nanny.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()} />
        <div className="entity-card-body">
          <div className="entity-card-title"><div><h2>{nanny.name}</h2><p>{nanny.weeklyHours}h / semaine</p></div>{nanny.hasAccount ? <ShieldCheck size={18} color="#4e7b68" /> : <ShieldOff size={18} color="#c0785e" />}</div>
          <div className="entity-detail"><KeyRound size={15} /><span>{nanny.username ? `Identifiant : ${nanny.username}` : "Aucun compte de connexion"}</span></div>
          {nanny.email && <div className="entity-detail"><Mail size={15} /><span>{nanny.email}</span></div>}
          {nanny.phone && <div className="entity-detail"><Phone size={15} /><span>{nanny.phone}</span></div>}
          {nanny.address && <div className="entity-detail"><MapPin size={15} /><span>{nanny.address}</span></div>}
          {nanny.idDocument && <div className="entity-detail"><IdCard size={15} /><span>Pièce d&apos;identité : {nanny.idDocument}</span></div>}
          <div className="schedule-strip"><span>Début de contrat</span><b>{nanny.startDate ? new Date(nanny.startDate).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Non défini"}</b></div>
          <div className="schedule-strip"><span>Rémunération</span><b>{nanny.monthlySalary ? `${nanny.monthlySalary} $/mois` : nanny.hourlyRate ? `${nanny.hourlyRate} $/h` : "Non définie"}</b></div>
          <div className="card-actions">
            <TelegramCallButton phone={nanny.phone} />
            <button type="button" className="outline-button" onClick={() => setProfiling(nanny)}><UserCog size={15} /> Modifier le profil</button>
            <button type="button" className="outline-button" onClick={() => setEditing(nanny)}><Settings2 size={15} /> Modifier la rémunération</button>
          </div>
        </div>
      </article>)}
      {nannies.length === 0 && <p className="page-subtitle">Aucune employée pour le moment. Créez son compte pour lui donner accès à son planning.</p>}
    </div>

    {creating && <div className="modal-backdrop"><form className="modal-card" action={createFormAction}>
      <button type="button" className="modal-close" onClick={() => setCreating(false)} aria-label="Fermer"><X size={18} /></button>
      <p className="eyebrow">Équipe de la famille</p><h2>Créer une employée</h2>
      <div className="form-columns"><label>Prénom<input name="firstName" required placeholder="Boneth" /></label><label>Nom<input name="lastName" required placeholder="Deap" /></label></div>
      <label>Identifiant de connexion<input name="username" required minLength={3} placeholder="boneth.d" autoComplete="off" /></label>
      <label>Mot de passe défini par la famille<input type="password" name="password" required minLength={8} autoComplete="new-password" /></label>
      <label>Email de contact (optionnel)<input type="email" name="contactEmail" placeholder="boneth@exemple.com" /></label>
      <label>Début de contrat<input type="datetime-local" name="startDate" required defaultValue={toIsoDateTimeLocal(new Date())} /></label>
      <div className="form-columns"><label>Heures / semaine<input type="number" name="weeklyHours" step="0.5" min="1" required defaultValue={35} /></label><label>Salaire mensuel ($)<input type="number" name="monthlySalary" step="1" min="0" /></label></div>
      <label>Taux horaire ($/h)<input type="number" name="hourlyRate" step="0.1" min="0" /></label>
      {createState.error && <p className="form-error">{createState.error}</p>}
      <button className="primary-button" type="submit" disabled={isCreating}>{isCreating ? "Création..." : "Créer le compte"}</button>
    </form></div>}

    {profiling && <div className="modal-backdrop"><form className="modal-card" action={profileFormAction}>
      <button type="button" className="modal-close" onClick={() => setProfiling(null)} aria-label="Fermer"><X size={18} /></button>
      <p className="eyebrow">{profiling.name}</p><h2>Profil de l&apos;employée</h2>
      <input type="hidden" name="nannyId" value={profiling.id} />
      <div className="profile-photo-row">
        <PhotoUploadField folder="nannies" blobEnabled={blobEnabled} initials={profiling.name.slice(0, 2).toUpperCase()} currentPhotoUrl={profiling.photoUrl} />
      </div>
      <label>Numéro de téléphone<input type="tel" name="phone" placeholder="+855 12 345 678" defaultValue={profiling.phone ?? ""} /></label>
      <label>Adresse<input name="address" placeholder="Rue, ville, pays" defaultValue={profiling.address ?? ""} /></label>
      <label>Numéro de carte d&apos;identité ou de passeport<input name="idDocument" placeholder="ID / Passeport" defaultValue={profiling.idDocument ?? ""} /></label>
      <label>Email de contact<input type="email" name="contactEmail" defaultValue={profiling.email ?? ""} /></label>
      <p className="page-subtitle">L&apos;employée peut mettre à jour sa photo elle-même depuis son espace « Mon profil ».</p>
      {profileState.error && <p className="form-error">{profileState.error}</p>}
      <button className="primary-button" type="submit" disabled={isUpdatingProfile}>{isUpdatingProfile ? "Enregistrement..." : "Enregistrer le profil"}</button>
    </form></div>}


    {editing && <div className="modal-backdrop"><form className="modal-card" action={rateFormAction}>
      <button type="button" className="modal-close" onClick={() => setEditing(null)} aria-label="Fermer"><X size={18} /></button>
      <p className="eyebrow">{editing.name}</p><h2>Modifier la rémunération</h2>
      <input type="hidden" name="nannyId" value={editing.id} />
      <label>Début de contrat<input type="datetime-local" name="startDate" required defaultValue={editing.startDate ?? toIsoDateTimeLocal(new Date())} /></label>
      <label>Heures / semaine<input type="number" name="weeklyHours" step="0.5" min="1" required defaultValue={editing.weeklyHours} /></label>
      <label>Salaire mensuel ($)<input type="number" name="monthlySalary" step="1" min="0" defaultValue={editing.monthlySalary ?? undefined} /></label>
      <label>Taux horaire ($/h)<input type="number" name="hourlyRate" step="0.1" min="0" defaultValue={editing.hourlyRate ?? undefined} /></label>
      {rateState.error && <p className="form-error">{rateState.error}</p>}
      <button className="primary-button" type="submit" disabled={isUpdatingRate}>{isUpdatingRate ? "Enregistrement..." : "Enregistrer"}</button>
    </form></div>}
  </>;
}

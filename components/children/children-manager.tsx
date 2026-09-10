"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Cake, NotebookPen, Pencil, Plus, School, Trash2, X } from "lucide-react";
import type { Child } from "@/lib/db/mock-data";
import { createChildAction, deleteChildAction, updateChildAction, updateChildPhotoAction } from "@/app/actions/children";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { PhotoUploadField } from "@/components/ui/photo-upload-field";

function formatBirthDate(value: string | null) {
  if (!value) return null;
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function schoolHours(child: Child) {
  if (!child.schoolStartTime && !child.schoolEndTime) return "Non défini";
  return `${child.schoolStartTime ?? "—"} - ${child.schoolEndTime ?? "—"}`;
}

export function ChildrenManager({ initialChildren, canEdit = true, blobEnabled = false }: { initialChildren: Child[]; canEdit?: boolean; blobEnabled?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Child | null>(null);
  const [photoChild, setPhotoChild] = useState<Child | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function fieldsOf(formData: FormData) {
    return {
      name: formData.get("name"),
      school: formData.get("school"),
      birthDate: formData.get("birthDate"),
      schoolStartTime: formData.get("schoolStartTime"),
      schoolEndTime: formData.get("schoolEndTime"),
      notes: formData.get("notes"),
    };
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await createChildAction(fieldsOf(formData));
      if (!result.ok) { setError(result.error); return; }
      form.reset();
      setOpen(false); setError(null);
      router.refresh();
    });
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateChildAction(editing.id, fieldsOf(formData));
      if (!result.ok) { setError(result.error); return; }
      setEditing(null); setError(null);
      router.refresh();
    });
  }

  function submitPhoto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateChildPhotoAction({ ok: false }, formData);
      if (!result.ok) { setPhotoError(result.error ?? null); return; }
      setPhotoChild(null); setPhotoError(null);
      router.refresh();
    });
  }

  function remove(childId: string) {
    startTransition(async () => { await deleteChildAction(childId); router.refresh(); });
  }

  return <>
    {canEdit && <button className="primary-button" onClick={() => setOpen(true)}><Plus size={17} /> Ajouter un enfant</button>}
    <div className="entity-grid">
      {initialChildren.map((child) => <article className="entity-card" key={child.id}>
        <ProfileAvatar photoUrl={child.photoUrl} initials={child.initials} color={child.color} />
        <div className="entity-card-body">
          <div className="entity-card-title">
            <div><h2>{child.name}</h2><p>{child.birthDate ? `${child.age} ans` : "Âge à préciser"}</p></div>
            {canEdit && <button type="button" className="more-button" onClick={() => remove(child.id)} aria-label="Supprimer l'enfant"><Trash2 size={17} /></button>}
          </div>
          {child.birthDate && <div className="entity-detail"><Cake size={15} /><span>Né(e) le {formatBirthDate(child.birthDate)}</span></div>}
          <div className="entity-detail"><School size={15} /><span>{child.school}</span></div>
          {child.notes && <div className="entity-detail"><NotebookPen size={15} /><span>{child.notes}</span></div>}
          <div className="schedule-strip"><span>École</span><b>{schoolHours(child)}</b></div>
          {canEdit && <div className="card-actions">
            <button type="button" className="outline-button" onClick={() => setPhotoChild(child)}><Camera size={15} /> Photo de profil</button>
            <button type="button" className="outline-button" onClick={() => { setEditing(child); setError(null); }}><Pencil size={15} /> Modifier</button>
          </div>}
        </div>
      </article>)}
      {initialChildren.length === 0 && <p className="page-subtitle">Aucun enfant enregistré pour le moment.</p>}
    </div>

    {canEdit && photoChild && <div className="modal-backdrop"><form className="modal-card" onSubmit={submitPhoto}>
      <button type="button" className="modal-close" onClick={() => { setPhotoChild(null); setPhotoError(null); }} aria-label="Fermer"><X size={18} /></button>
      <p className="eyebrow">{photoChild.name}</p><h2>Photo de profil</h2>
      <input type="hidden" name="childId" value={photoChild.id} />
      <PhotoUploadField key={photoChild.id} folder="children" blobEnabled={blobEnabled} initials={photoChild.initials} color={photoChild.color} currentPhotoUrl={photoChild.photoUrl} label="Choisir une image (JPG, PNG ou WEBP — 5 Mo max)" required />
      {photoError && <p className="form-error">{photoError}</p>}
      <button className="primary-button" type="submit" disabled={isPending}>{isPending ? "Envoi..." : "Enregistrer la photo"}</button>
    </form></div>}

    {canEdit && (open || editing) && <div className="modal-backdrop"><form className="modal-card" onSubmit={editing ? submitEdit : submit}>
      <button type="button" className="modal-close" onClick={() => { setOpen(false); setEditing(null); setError(null); }} aria-label="Fermer"><X size={18} /></button>
      <p className="eyebrow">{editing ? editing.name : "Les enfants"}</p><h2>{editing ? "Modifier le profil" : "Ajouter un enfant"}</h2>
      <label>Prénom et nom<input name="name" required defaultValue={editing?.name ?? ""} placeholder="Ex. Loukas Martin" /></label>
      <label>Date de naissance<input type="date" name="birthDate" defaultValue={editing?.birthDate ?? ""} /></label>
      <label>École<input name="school" defaultValue={editing?.school === "À préciser" ? "" : editing?.school ?? ""} placeholder="École des Lilas" /></label>
      <div className="form-columns">
        <label>Arrivée à l&apos;école<input type="time" name="schoolStartTime" defaultValue={editing?.schoolStartTime ?? ""} /></label>
        <label>Sortie de l&apos;école<input type="time" name="schoolEndTime" defaultValue={editing?.schoolEndTime ?? ""} /></label>
      </div>
      <label>Informations utiles<input name="notes" defaultValue={editing?.notes ?? ""} placeholder="Allergies, habitudes, activités..." /></label>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-button" type="submit" disabled={isPending}>{isPending ? "Enregistrement..." : editing ? "Enregistrer les modifications" : "Enregistrer l'enfant"}</button>
    </form></div>}
  </>;
}

"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Camera, ChevronRight, Plus, Trash2, X } from "lucide-react";
import type { Child } from "@/lib/db/mock-data";
import { createChildAction, deleteChildAction, updateChildPhotoAction } from "@/app/actions/children";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { PhotoUploadField } from "@/components/ui/photo-upload-field";

export function ChildrenManager({ initialChildren, canEdit = true, blobEnabled = false }: { initialChildren: Child[]; canEdit?: boolean; blobEnabled?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [photoChild, setPhotoChild] = useState<Child | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const displayedChildren = initialChildren;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await createChildAction({ name: formData.get("name"), age: formData.get("age"), school: formData.get("school") });
      if (!result.ok) { setError(result.error); return; }
      form.reset();
      setOpen(false); setError(null);
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
  return <>{canEdit && <button className="primary-button" onClick={() => setOpen(true)}><Plus size={17} /> Ajouter un enfant</button>}<div className="entity-grid">{displayedChildren.map((child) => <article className="entity-card" key={child.id}><ProfileAvatar photoUrl={child.photoUrl} initials={child.initials} color={child.color} /><div className="entity-card-body"><div className="entity-card-title"><div><h2>{child.name}</h2><p>{child.age} ans</p></div>{canEdit ? <button type="button" className="more-button" onClick={() => remove(child.id)} aria-label="Supprimer l'enfant"><Trash2 size={17} /></button> : <ChevronRight size={18} />}</div><div className="entity-detail"><CalendarDays size={15} /><span>{child.school}</span></div><div className="schedule-strip"><span>École</span><b>08:00 - 15:30</b></div>{canEdit && <div className="card-actions"><button type="button" className="outline-button" onClick={() => setPhotoChild(child)}><Camera size={15} /> Photo de profil</button></div>}</div></article>)}</div>{canEdit && photoChild && <div className="modal-backdrop"><form className="modal-card" onSubmit={submitPhoto}><button type="button" className="modal-close" onClick={() => { setPhotoChild(null); setPhotoError(null); }} aria-label="Fermer"><X size={18} /></button><p className="eyebrow">{photoChild.name}</p><h2>Photo de profil</h2><input type="hidden" name="childId" value={photoChild.id} /><PhotoUploadField key={photoChild.id} folder="children" blobEnabled={blobEnabled} initials={photoChild.initials} color={photoChild.color} currentPhotoUrl={photoChild.photoUrl} label="Choisir une image (JPG, PNG ou WEBP — 5 Mo max)" required />{photoError && <p className="form-error">{photoError}</p>}<button className="primary-button" type="submit" disabled={isPending}>{isPending ? "Envoi..." : "Enregistrer la photo"}</button></form></div>}{canEdit && open && <div className="modal-backdrop"><form className="modal-card" onSubmit={submit}><button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Fermer"><X size={18} /></button><p className="eyebrow">Famille Martin</p><h2>Ajouter un enfant</h2><label>Prénom et nom<input name="name" required placeholder="Ex. Loukas Martin" /></label><label>Âge<input name="age" type="number" min="0" max="18" placeholder="7" /></label><label>École<input name="school" placeholder="École des Lilas" /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" type="submit" disabled={isPending}>{isPending ? "Enregistrement..." : "Enregistrer l'enfant"}</button></form></div>}</>;
}

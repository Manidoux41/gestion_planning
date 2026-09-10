"use client";

import { FormEvent, useActionState, useState, useTransition } from "react";
import { CalendarDays, Camera, ChevronRight, Plus, Trash2, X } from "lucide-react";
import type { Child } from "@/lib/db/mock-data";
import { createChildAction, deleteChildAction, updateChildPhotoAction, type ChildPhotoState } from "@/app/actions/children";
import { ProfileAvatar } from "@/components/ui/profile-avatar";

const initialPhotoState: ChildPhotoState = { ok: false };

export function ChildrenManager({ initialChildren, canEdit = true }: { initialChildren: Child[]; canEdit?: boolean }) {
  const [children, setChildren] = useState(initialChildren);
  const [open, setOpen] = useState(false);
  const [photoChild, setPhotoChild] = useState<Child | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [photoState, photoFormAction, isUploading] = useActionState(updateChildPhotoAction, initialPhotoState);
  const uploadedPhoto = photoState.ok && photoState.childId && photoState.photoUrl ? { id: photoState.childId, photoUrl: photoState.photoUrl } : null;
  const displayedChildren = children.map((item) => (uploadedPhoto && item.id === uploadedPhoto.id ? { ...item, photoUrl: uploadedPhoto.photoUrl } : item));
  const photoModalChild = photoChild && uploadedPhoto?.id === photoChild.id ? null : photoChild;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createChildAction({ name: formData.get("name"), age: formData.get("age"), school: formData.get("school") });
      if (!result.ok) { setError(result.error); return; }
      setChildren((current) => [...current, result.child]);
      setOpen(false); setError(null); event.currentTarget.reset();
    });
  }
  function remove(childId: string) {
    setChildren((current) => current.filter((item) => item.id !== childId));
    startTransition(async () => { await deleteChildAction(childId); });
  }
  return <>{canEdit && <button className="primary-button" onClick={() => setOpen(true)}><Plus size={17} /> Ajouter un enfant</button>}<div className="entity-grid">{displayedChildren.map((child) => <article className="entity-card" key={child.id}><ProfileAvatar photoUrl={child.photoUrl} initials={child.initials} color={child.color} /><div className="entity-card-body"><div className="entity-card-title"><div><h2>{child.name}</h2><p>{child.age} ans</p></div>{canEdit ? <button type="button" className="more-button" onClick={() => remove(child.id)} aria-label="Supprimer l'enfant"><Trash2 size={17} /></button> : <ChevronRight size={18} />}</div><div className="entity-detail"><CalendarDays size={15} /><span>{child.school}</span></div><div className="schedule-strip"><span>École</span><b>08:00 - 15:30</b></div>{canEdit && <div className="card-actions"><button type="button" className="outline-button" onClick={() => setPhotoChild(child)}><Camera size={15} /> Photo de profil</button></div>}</div></article>)}</div>{canEdit && photoModalChild && <div className="modal-backdrop"><form className="modal-card" action={photoFormAction}><button type="button" className="modal-close" onClick={() => setPhotoChild(null)} aria-label="Fermer"><X size={18} /></button><p className="eyebrow">{photoModalChild.name}</p><h2>Photo de profil</h2><input type="hidden" name="childId" value={photoModalChild.id} /><div className="profile-photo-row"><ProfileAvatar photoUrl={photoModalChild.photoUrl} initials={photoModalChild.initials} color={photoModalChild.color} /><label style={{ flex: 1 }}>Choisir une image (JPG, PNG ou WEBP — 4 Mo max)<input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required /></label></div>{photoState.error && <p className="form-error">{photoState.error}</p>}<button className="primary-button" type="submit" disabled={isUploading}>{isUploading ? "Envoi..." : "Enregistrer la photo"}</button></form></div>}{canEdit && open && <div className="modal-backdrop"><form className="modal-card" onSubmit={submit}><button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Fermer"><X size={18} /></button><p className="eyebrow">Famille Martin</p><h2>Ajouter un enfant</h2><label>Prénom et nom<input name="name" required placeholder="Ex. Loukas Martin" /></label><label>Âge<input name="age" type="number" min="0" max="18" placeholder="7" /></label><label>École<input name="school" placeholder="École des Lilas" /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" type="submit" disabled={isPending}>{isPending ? "Enregistrement..." : "Enregistrer l'enfant"}</button></form></div>}</>;
}

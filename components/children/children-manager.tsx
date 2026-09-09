"use client";

import { FormEvent, useState, useTransition } from "react";
import { CalendarDays, ChevronRight, Plus, X } from "lucide-react";
import type { Child } from "@/lib/db/mock-data";
import { createChildAction } from "@/app/actions/children";

export function ChildrenManager({ initialChildren }: { initialChildren: Child[] }) {
  const [children, setChildren] = useState(initialChildren);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
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
  return <><button className="primary-button" onClick={() => setOpen(true)}><Plus size={17} /> Ajouter un enfant</button><div className="entity-grid">{children.map((child) => <article className="entity-card" key={child.id}><div className={`entity-avatar ${child.color}`}>{child.initials}</div><div className="entity-card-body"><div className="entity-card-title"><div><h2>{child.name}</h2><p>{child.age} ans</p></div><ChevronRight size={18} /></div><div className="entity-detail"><CalendarDays size={15} /><span>{child.school}</span></div><div className="schedule-strip"><span>École</span><b>08:00 - 15:30</b></div></div></article>)}</div>{open && <div className="modal-backdrop"><form className="modal-card" onSubmit={submit}><button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Fermer"><X size={18} /></button><p className="eyebrow">Famille Martin</p><h2>Ajouter un enfant</h2><label>Prénom et nom<input name="name" required placeholder="Ex. Loukas Martin" /></label><label>Âge<input name="age" type="number" min="0" max="18" placeholder="7" /></label><label>École<input name="school" placeholder="École des Lilas" /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" type="submit" disabled={isPending}>{isPending ? "Enregistrement..." : "Enregistrer l'enfant"}</button></form></div>}</>;
}

"use client";

import { FormEvent, useState, useTransition } from "react";
import { Check, Clock3, Plus, Tag, X } from "lucide-react";
import type { Child, Task } from "@/lib/db/mock-data";
import { createTaskAction } from "@/app/actions/tasks";

export function TasksManager({ initialTasks, childOptions }: { initialTasks: Task[]; childOptions: Child[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createTaskAction({ title: formData.get("title"), time: formData.get("time"), child: formData.get("child"), category: formData.get("category"), priority: formData.get("priority") });
      if (!result.ok) { setError(result.error); return; }
      setTasks((current) => [...current, result.task]);
      setOpen(false); setError(null); event.currentTarget.reset();
    });
  }
  return <><button className="primary-button" onClick={() => setOpen(true)}><Plus size={17} /> Nouvelle tâche</button><div className="filter-row"><button className="filter-chip active">Toutes <b>{tasks.length}</b></button><button className="filter-chip">À faire <b>{tasks.filter((task) => !task.done).length}</b></button><button className="filter-chip">Terminées <b>{tasks.filter((task) => task.done).length}</b></button></div><section className="task-page-list">{tasks.map((task) => <article className={`task-page-row ${task.done ? "done" : ""}`} key={task.id}><span className="task-check">{task.done && <Check size={14} />}</span><div className="task-page-main"><h2>{task.title}</h2><div className="task-meta"><span><Clock3 size={13} /> {task.time}</span><span><Tag size={13} /> {task.category}</span><span>{task.child}</span></div></div><span className={`priority-badge ${task.priority === "Important" ? "important" : ""}`}>{task.priority}</span></article>)}</section>{open && <div className="modal-backdrop"><form className="modal-card" onSubmit={submit}><button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Fermer"><X size={18} /></button><p className="eyebrow">Organisation quotidienne</p><h2>Nouvelle tâche</h2><label>Titre<input name="title" required placeholder="Ex. Préparer le goûter" /></label><div className="form-columns"><label>Heure<input name="time" type="time" required /></label><label>Priorité<select name="priority"><option>Normale</option><option>Important</option></select></label></div><label>Enfant<select name="child">{childOptions.map((child) => <option key={child.id}>{child.name.split(" ")[0]}</option>)}</select></label><label>Catégorie<select name="category"><option>Enfants</option><option>École</option><option>Repas</option><option>Maison</option><option>Courses</option></select></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" type="submit" disabled={isPending}>{isPending ? "Enregistrement..." : "Enregistrer la tâche"}</button></form></div>}</>;
}

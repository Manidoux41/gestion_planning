"use client";

import { FormEvent, useState, useTransition } from "react";
import { Check, Clock3, Plus, Tag, Trash2, X } from "lucide-react";
import type { Child, Task } from "@/lib/db/mock-data";
import { createTaskAction, deleteTaskAction, toggleTaskDoneAction } from "@/app/actions/tasks";
import { formatDuration, getReferenceToday, toIsoDate } from "@/lib/utils/dates";

function formatDate(date: string): string {
  if (!date) return "";
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function TasksManager({ initialTasks, childOptions, canEdit = true }: { initialTasks: Task[]; childOptions: Child[]; canEdit?: boolean }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [, startToggleTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createTaskAction({ title: formData.get("title"), date: formData.get("date"), time: formData.get("time"), endTime: formData.get("endTime"), child: formData.get("child"), category: formData.get("category"), priority: formData.get("priority") });
      if (!result.ok) { setError(result.error); return; }
      setTasks((current) => [...current, result.task]);
      setOpen(false); setError(null); event.currentTarget.reset();
    });
  }

  function toggleDone(task: Task) {
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: !item.done } : item));
    startToggleTransition(async () => { await toggleTaskDoneAction(task.id, !task.done); });
  }

  function remove(taskId: string) {
    setTasks((current) => current.filter((item) => item.id !== taskId));
    startToggleTransition(async () => { await deleteTaskAction(taskId); });
  }

  return <>
    {canEdit && <button className="primary-button" onClick={() => setOpen(true)}><Plus size={17} /> Nouvelle tâche</button>}
    <div className="filter-row">
      <button className="filter-chip active">Toutes <b>{tasks.length}</b></button>
      <button className="filter-chip">À faire <b>{tasks.filter((task) => !task.done).length}</b></button>
      <button className="filter-chip">Terminées <b>{tasks.filter((task) => task.done).length}</b></button>
    </div>
    <section className="task-page-list">{tasks.map((task) => {
      const duration = formatDuration(task.time, task.endTime);
      return <article className={`task-page-row ${task.done ? "done" : ""}`} key={task.id}>
        <button type="button" className="task-check" onClick={() => toggleDone(task)} aria-label={task.done ? "Marquer comme à faire" : "Marquer comme terminée"}>{task.done && <Check size={14} />}</button>
        <div className="task-page-main">
          <h2>{task.title}</h2>
          <div className="task-meta">
            <span><Clock3 size={13} /> {formatDate(task.date)} · {task.time}{task.endTime ? ` - ${task.endTime}` : ""}{duration ? ` (${duration})` : ""}</span>
            <span><Tag size={13} /> {task.category}</span>
            <span>{task.child}</span>
          </div>
        </div>
        <span className={`priority-badge ${task.priority === "Important" ? "important" : ""}`}>{task.priority}</span>
        {canEdit && <button type="button" className="more-button" onClick={() => remove(task.id)} aria-label="Supprimer la tâche"><Trash2 size={16} /></button>}
      </article>;
    })}</section>

    {canEdit && open && <div className="modal-backdrop"><form className="modal-card" onSubmit={submit}>
      <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Fermer"><X size={18} /></button>
      <p className="eyebrow">Organisation quotidienne</p><h2>Nouvelle tâche</h2>
      <label>Titre<input name="title" required placeholder="Ex. Préparer le goûter" /></label>
      <div className="form-columns"><label>Date<input name="date" type="date" required defaultValue={toIsoDate(getReferenceToday())} /></label><label>Priorité<select name="priority"><option>Normale</option><option>Important</option></select></label></div>
      <div className="form-columns"><label>Début<input name="time" type="time" required /></label><label>Fin<input name="endTime" type="time" required /></label></div>
      <label>Enfant<select name="child">{childOptions.map((child) => <option key={child.id}>{child.name.split(" ")[0]}</option>)}</select></label>
      <label>Catégorie<select name="category"><option>Enfants</option><option>École</option><option>Repas</option><option>Maison</option><option>Courses</option></select></label>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-button" type="submit" disabled={isPending}>{isPending ? "Enregistrement..." : "Enregistrer la tâche"}</button>
    </form></div>}
  </>;
}

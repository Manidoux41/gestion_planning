"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toggleTaskDoneAction } from "@/app/actions/tasks";

export type DashboardTask = { id: string; title: string; time: string; child: string; done: boolean };

export function DashboardTaskList({ tasks }: { tasks: DashboardTask[] }) {
  const [items, setItems] = useState(tasks);
  const [, startTransition] = useTransition();

  function toggle(task: DashboardTask) {
    setItems((current) => current.map((item) => item.id === task.id ? { ...item, done: !item.done } : item));
    startTransition(async () => { await toggleTaskDoneAction(task.id, !task.done); });
  }

  if (items.length === 0) return <p className="page-subtitle">Aucune tâche prévue aujourd&apos;hui.</p>;

  return <div className="task-list">{items.map((task) => <div className={`task-row ${task.done ? "done" : ""}`} key={task.id}><button type="button" className="task-check" onClick={() => toggle(task)} aria-label={task.done ? "Marquer comme à faire" : "Marquer comme terminée"}>{task.done && <Check size={14} />}</button><div><b>{task.title}</b><small>{task.time} · {task.child}</small></div></div>)}</div>;
}

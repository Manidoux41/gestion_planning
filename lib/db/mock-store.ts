"use client";

import type { Child, ScheduleEvent, Task } from "./domain-types";

export type { ScheduleEvent } from "./domain-types";

const keys = { children: "maison-douce.children.v1", tasks: "maison-douce.tasks.v1", events: "maison-douce.events.v1" } as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const value = window.localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}

function write<T>(key: string, value: T) { window.localStorage.setItem(key, JSON.stringify(value)); }

export const mockStore = {
  listChildren(initial: Child[]) { return read(keys.children, initial); },
  createChild(initial: Child[], child: Child) { const items = [...this.listChildren(initial), child]; write(keys.children, items); return items; },
  listTasks(initial: Task[]) { return read(keys.tasks, initial); },
  createTask(initial: Task[], task: Task) { const items = [...this.listTasks(initial), task]; write(keys.tasks, items); return items; },
  listEvents(initial: ScheduleEvent[]) { return read(keys.events, initial); },
  createEvent(initial: ScheduleEvent[], event: ScheduleEvent) { const items = [...this.listEvents(initial), event]; write(keys.events, items); return items; },
};

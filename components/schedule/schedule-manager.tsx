"use client";

import { FormEvent, useState, useTransition } from "react";
import { CalendarDays, CheckSquare, ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import type { ScheduleEvent, Task } from "@/lib/db/domain-types";
import { createScheduleEventAction, deleteScheduleEventAction } from "@/app/actions/schedule";
import { formatDuration, getReferenceToday, toIsoDate } from "@/lib/utils/dates";

type CalendarView = "week" | "day" | "month";
type CalendarEntry = { id: string; date: string; time: string; endTime?: string; title: string; type: string; kind: "event" | "task" };

const dayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const monthFormatter = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const shortDayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });
const monthDayFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric" });

function getWeekDays(date: Date) { const monday = new Date(date); monday.setDate(date.getDate() - ((date.getDay() + 6) % 7)); return Array.from({ length: 7 }, (_, index) => { const day = new Date(monday); day.setDate(monday.getDate() + index); return day; }); }
function getMonthDays(date: Date) { const firstDay = new Date(date.getFullYear(), date.getMonth(), 1); const start = new Date(firstDay); start.setDate(1 - ((firstDay.getDay() + 6) % 7)); return Array.from({ length: 42 }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); return day; }); }
function sameDay(first: Date, second: Date) { return first.toDateString() === second.toDateString(); }

export function ScheduleManager({ initialEvents, initialTasks = [], canEdit = true }: { initialEvents: ScheduleEvent[]; initialTasks?: Task[]; canEdit?: boolean }) {
  const [events, setEvents] = useState(initialEvents);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<CalendarView>("week");
  const [selectedDate, setSelectedDate] = useState(getReferenceToday);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const weekDays = getWeekDays(selectedDate);
  const monthDays = getMonthDays(selectedDate);

  const entries: CalendarEntry[] = [
    ...events.map((event): CalendarEntry => ({ id: event.id, date: event.date, time: event.time, endTime: event.endTime, title: event.title, type: event.type, kind: "event" })),
    ...initialTasks.filter((task) => task.date).map((task): CalendarEntry => ({ id: task.id, date: task.date, time: task.time, endTime: task.endTime, title: task.title, type: task.category, kind: "task" })),
  ].sort((first, second) => first.time.localeCompare(second.time));

  const entriesForDate = (date: Date) => entries.filter((entry) => entry.date === toIsoDate(date));
  const dayEntries = entriesForDate(selectedDate);

  const periodLabel = view === "day" ? dayFormatter.format(selectedDate) : view === "month" ? monthFormatter.format(selectedDate) : `${weekDays[0]?.getDate() ?? 0} - ${weekDays[6]?.getDate() ?? 0} ${monthFormatter.format(selectedDate)}`;

  function movePeriod(direction: number) {
    const nextDate = new Date(selectedDate);
    if (view === "day") nextDate.setDate(selectedDate.getDate() + direction);
    if (view === "week") nextDate.setDate(selectedDate.getDate() + direction * 7);
    if (view === "month") nextDate.setMonth(selectedDate.getMonth() + direction);
    setSelectedDate(nextDate);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createScheduleEventAction({ title: formData.get("title"), date: formData.get("date"), time: formData.get("time"), endTime: formData.get("endTime"), type: formData.get("type") });
      if (!result.ok) { setError(result.error); return; }
      setEvents((current) => [...current, result.event]);
      setOpen(false); setError(null); event.currentTarget.reset();
    });
  }

  function removeEvent(eventId: string) {
    setEvents((current) => current.filter((item) => item.id !== eventId));
    startTransition(async () => { await deleteScheduleEventAction(eventId); });
  }

  function entryCard(entry: CalendarEntry) {
    const isTask = entry.kind === "task";
    const duration = entry.endTime ? formatDuration(entry.time, entry.endTime) : "";
    const range = entry.endTime ? `${entry.time} - ${entry.endTime}${duration ? ` (${duration})` : ""}` : entry.time;
    return <div className={`event-block ${isTask ? "event-tache" : `event-${entry.type.toLowerCase()}`}`} key={`${entry.kind}-${entry.id}`}>
      {isTask && <CheckSquare size={12} />}
      <b>{entry.title}</b>
      <small>{isTask ? `Tâche · ${range}` : `${entry.type} · ${range}`}</small>
      {!isTask && canEdit && <button type="button" className="more-button" onClick={() => removeEvent(entry.id)} aria-label="Supprimer l'événement"><Trash2 size={13} /></button>}
    </div>;
  }

  return <>
    <div className="schedule-actions">{canEdit && <button type="button" className="primary-button" onClick={() => setOpen(true)}><Plus size={17} /> Nouvel événement</button>}</div>
    <div className="calendar-toolbar">
      <button type="button" className="icon-button calendar-nav-button" onClick={() => movePeriod(-1)} aria-label="Période précédente"><ChevronLeft size={18} /></button>
      <strong>{periodLabel}</strong>
      <button type="button" className="icon-button calendar-nav-button" onClick={() => movePeriod(1)} aria-label="Période suivante"><ChevronRight size={18} /></button>
      <button type="button" className="today-button" onClick={() => setSelectedDate(getReferenceToday())}>Aujourd&apos;hui</button>
      <div className="view-switch">{([["week", "Semaine"], ["day", "Jour"], ["month", "Mois"]] as const).map(([value, label]) => <button type="button" className={view === value ? "active" : ""} key={value} onClick={() => setView(value)}>{label}</button>)}</div>
    </div>

    {view === "week" && <div className="week-day-picker">{weekDays.map((date) => <button type="button" className={sameDay(date, selectedDate) ? "active" : ""} key={date.toISOString()} onClick={() => setSelectedDate(date)}><small>{shortDayFormatter.format(date).replace(".", "")}</small><b>{date.getDate()}</b></button>)}</div>}

    {view === "day" && <section className="calendar-card calendar-day"><div className="calendar-day-header"><CalendarDays size={18} /><span>{dayFormatter.format(selectedDate).split(" ")[0]}</span><b>{dayFormatter.format(selectedDate).slice(dayFormatter.format(selectedDate).indexOf(" ") + 1)}</b></div><div className="day-timeline">{dayEntries.length === 0 && <p className="page-subtitle">Aucun événement ni tâche ce jour-là.</p>}{dayEntries.map((entry) => <div className="event-row" key={`${entry.kind}-${entry.id}`}><time>{entry.time}</time>{entryCard(entry)}</div>)}</div></section>}

    {view === "week" && <section className="calendar-card calendar-week"><div className="week-grid-header">{weekDays.map((date) => <button type="button" className={sameDay(date, selectedDate) ? "selected" : ""} key={date.toISOString()} onClick={() => setSelectedDate(date)}><small>{shortDayFormatter.format(date).replace(".", "")}</small><b>{date.getDate()}</b></button>)}</div><div className="week-grid-body">{weekDays.map((date) => <div className={`week-grid-column ${sameDay(date, selectedDate) ? "selected" : ""}`} key={date.toISOString()}>{entriesForDate(date).map(entryCard)}</div>)}</div></section>}

    {view === "month" && <section className="calendar-card calendar-month"><div className="month-grid-header">{["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => <span key={day}>{day}</span>)}</div><div className="month-grid">{monthDays.map((date) => { const inMonth = date.getMonth() === selectedDate.getMonth(); const selected = sameDay(date, selectedDate); const dayItems = entriesForDate(date); return <button type="button" className={`month-cell ${inMonth ? "in-month" : "outside-month"} ${selected ? "selected" : ""}`} key={date.toISOString()} onClick={() => setSelectedDate(date)}><span>{monthDayFormatter.format(date)}</span>{dayItems.slice(0, 2).map((entry) => <em key={`${entry.kind}-${entry.id}`}>{entry.time} · {entry.title}</em>)}</button>; })}</div></section>}

    {canEdit && open && <div className="modal-backdrop"><form className="modal-card" onSubmit={submit}>
      <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Fermer"><X size={18} /></button>
      <p className="eyebrow">Planning familial</p><h2>Nouvel événement</h2>
      <label>Titre<input name="title" required placeholder="Ex. Rendez-vous médical" /></label>
      <div className="form-columns"><label>Date<input name="date" type="date" required defaultValue={toIsoDate(selectedDate)} /></label><label>Arrivée<input name="time" type="time" required /></label></div>
      <label>Fin<input name="endTime" type="time" required /></label>
      <label>Type<select name="type"><option>Présence</option><option>Enfants</option><option>École</option><option>Repas</option><option>Autre</option></select></label>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-button" type="submit" disabled={isPending}>{isPending ? "Enregistrement..." : "Enregistrer l'événement"}</button>
    </form></div>}
  </>;
}

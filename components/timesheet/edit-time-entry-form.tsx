"use client";

import { useActionState, useState } from "react";
import { Pencil, X } from "lucide-react";
import { updateTimeEntryAction, type TimesheetActionState } from "@/app/actions/timesheet";

const initialState: TimesheetActionState = { ok: false };

export function EditTimeEntryForm({ entryId, nannyName, date, arrival, departure }: { entryId: string; nannyName: string; date: string; arrival: string; departure: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(updateTimeEntryAction, initialState);

  return <>
    <button type="button" className="more-button" aria-label="Modifier ce pointage" onClick={() => setOpen(true)}><Pencil size={15} color="#7c93b8" /></button>
    {open && <div className="modal-backdrop"><form className="modal-card" action={formAction}>
      <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Fermer"><X size={18} /></button>
      <p className="eyebrow">{nannyName}</p><h2>Modifier le pointage</h2>
      <input type="hidden" name="entryId" value={entryId} />
      <label>Date<input type="date" name="date" defaultValue={date} required /></label>
      <div className="form-columns"><label>Arrivée<input type="time" name="arrival" defaultValue={arrival} required /></label><label>Départ<input type="time" name="departure" defaultValue={departure} required /></label></div>
      {state.error && <p className="form-error">{state.error}</p>}
      <button className="primary-button" type="submit" disabled={isPending}>{isPending ? "Enregistrement..." : "Enregistrer les modifications"}</button>
    </form></div>}
  </>;
}

"use client";

import { useActionState, useState } from "react";
import { ClipboardPlus, X } from "lucide-react";
import { createManualTimeEntryAction, type TimesheetActionState } from "@/app/actions/timesheet";

const initialState: TimesheetActionState = { ok: false };

export function ManualTimeEntryForm({ nannies }: { nannies: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createManualTimeEntryAction, initialState);

  if (nannies.length === 0) return null;

  return <>
    <button type="button" className="outline-button" onClick={() => setOpen(true)}><ClipboardPlus size={15} /> Ajouter ou corriger un pointage</button>
    {open && <div className="modal-backdrop"><form className="modal-card" action={formAction}>
      <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Fermer"><X size={18} /></button>
      <p className="eyebrow">Pointage manuel</p><h2>Ajouter ou corriger un pointage</h2>
      <p className="page-subtitle">Pour une heure non encore notée ou notée en retard sur le planning. Ce pointage est validé immédiatement.</p>
      <label>Employée<select name="nannyId" required>{nannies.map((nanny) => <option value={nanny.id} key={nanny.id}>{nanny.name}</option>)}</select></label>
      <label>Date<input type="date" name="date" required /></label>
      <div className="form-columns"><label>Arrivée<input type="time" name="arrival" required /></label><label>Départ<input type="time" name="departure" required /></label></div>
      {state.ok && <p className="page-subtitle">Pointage enregistré et validé.</p>}
      {state.error && <p className="form-error">{state.error}</p>}
      <button className="primary-button" type="submit" disabled={isPending}>{isPending ? "Enregistrement..." : "Enregistrer le pointage"}</button>
    </form></div>}
  </>;
}

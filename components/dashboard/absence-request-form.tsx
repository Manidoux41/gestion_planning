"use client";

import { useActionState, useState } from "react";
import { CalendarPlus, X } from "lucide-react";
import { requestAbsenceAction, type AbsenceActionState } from "@/app/actions/absences";

const initialState: AbsenceActionState = { ok: false };

export function AbsenceRequestForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(requestAbsenceAction, initialState);

  return <>
    <button type="button" className="outline-button" onClick={() => setOpen(true)}><CalendarPlus size={15} /> Faire une demande d&apos;absence</button>
    {open && <div className="modal-backdrop"><form className="modal-card" action={formAction}>
      <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Fermer"><X size={18} /></button>
      <p className="eyebrow">Votre planning</p><h2>Demande d&apos;absence</h2>
      <label>Type<select name="type"><option value="CONGE">Congé</option><option value="MALADIE">Maladie</option><option value="EXCEPTIONNELLE">Absence exceptionnelle</option></select></label>
      <div className="form-columns"><label>Du<input type="date" name="startsOn" required /></label><label>Au<input type="date" name="endsOn" required /></label></div>
      <label>Commentaire (optionnel)<input name="comment" placeholder="Précisez si besoin" /></label>
      {state.ok && <p className="page-subtitle">Demande envoyée, en attente de validation.</p>}
      {state.error && <p className="form-error">{state.error}</p>}
      <button className="primary-button" type="submit" disabled={isPending}>{isPending ? "Envoi..." : "Envoyer la demande"}</button>
    </form></div>}
  </>;
}

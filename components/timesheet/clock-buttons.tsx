"use client";

import { useState, useTransition } from "react";
import { LogIn, LogOut } from "lucide-react";
import { clockInAction, clockOutAction } from "@/app/actions/timesheet";

type ClockState = "not-started" | "morning-in" | "morning-done" | "afternoon-in" | "day-done";

export function ClockButtons({ state, arrivalLabel }: { state: ClockState; arrivalLabel: string }) {
  const [current, setCurrent] = useState(state);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClockIn() {
    startTransition(async () => {
      const result = await clockInAction();
      if (!result.ok) { setError(result.error ?? null); return; }
      setError(null); setCurrent(current === "morning-done" ? "afternoon-in" : "morning-in");
    });
  }

  function handleClockOut() {
    startTransition(async () => {
      const result = await clockOutAction();
      if (!result.ok) { setError(result.error ?? null); return; }
      setError(null); setCurrent(current === "afternoon-in" ? "day-done" : "morning-done");
    });
  }

  if (current === "day-done") return <p className="page-subtitle">Journée terminée{arrivalLabel ? ` · arrivée du matin à ${arrivalLabel}` : ""}. À demain !</p>;

  return <>
    {(current === "not-started" || current === "morning-done") && <button type="button" className="clock-button" onClick={handleClockIn} disabled={isPending}><LogIn size={18} /> {isPending ? "..." : current === "morning-done" ? "Pointer mon arrivée d'après-midi" : "Pointer mon arrivée du matin"}</button>}
    {(current === "morning-in" || current === "afternoon-in") && <button type="button" className="clock-button" onClick={handleClockOut} disabled={isPending}><LogOut size={18} /> {isPending ? "..." : current === "afternoon-in" ? "Pointer mon départ d'après-midi" : "Pointer mon départ du matin"}</button>}
    {error && <p className="form-error">{error}</p>}
  </>;
}

"use client";

import { useState, useTransition } from "react";
import { LogIn, LogOut } from "lucide-react";
import { clockInAction, clockOutAction } from "@/app/actions/timesheet";

type ClockState = "not-started" | "clocked-in" | "clocked-out";

export function ClockButtons({ state, arrivalLabel }: { state: ClockState; arrivalLabel: string }) {
  const [current, setCurrent] = useState(state);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClockIn() {
    startTransition(async () => {
      const result = await clockInAction();
      if (!result.ok) { setError(result.error ?? null); return; }
      setError(null); setCurrent("clocked-in");
    });
  }

  function handleClockOut() {
    startTransition(async () => {
      const result = await clockOutAction();
      if (!result.ok) { setError(result.error ?? null); return; }
      setError(null); setCurrent("clocked-out");
    });
  }

  if (current === "clocked-out") return <p className="page-subtitle">Journée terminée{arrivalLabel ? ` · arrivée à ${arrivalLabel}` : ""}. À demain !</p>;

  return <>
    {current === "not-started" && <button type="button" className="clock-button" onClick={handleClockIn} disabled={isPending}><LogIn size={18} /> {isPending ? "..." : "Pointer mon arrivée"}</button>}
    {current === "clocked-in" && <button type="button" className="clock-button" onClick={handleClockOut} disabled={isPending}><LogOut size={18} /> {isPending ? "..." : "Pointer mon départ"}</button>}
    {error && <p className="form-error">{error}</p>}
  </>;
}

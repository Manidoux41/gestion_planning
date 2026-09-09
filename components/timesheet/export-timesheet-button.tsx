"use client";

import { useState } from "react";
import { Check, Download } from "lucide-react";
import type { TimeEntry } from "@/lib/db/mock-data";

export function ExportTimesheetButton({ entries }: { entries: TimeEntry[] }) {
  const [exported, setExported] = useState(false);
  function exportCsv() {
    const rows = [["Jour", "Date", "Arrivée", "Départ", "Durée", "Statut"], ...entries.map((entry) => [entry.day, entry.date, entry.arrival, entry.departure, entry.duration, entry.status])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "pointages-septembre-2026.csv"; link.click(); URL.revokeObjectURL(url); setExported(true);
  }
  return <button className="outline-button" onClick={exportCsv}>{exported ? <Check size={15} /> : <Download size={15} />} {exported ? "Exporté" : "Exporter"}</button>;
}

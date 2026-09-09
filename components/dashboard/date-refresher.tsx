"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toIsoDate } from "@/lib/utils/dates";

/** Force un rafraîchissement du tableau de bord quand la date change (minuit passé, tab remis au premier plan un autre jour). */
export function DashboardDateRefresher({ serverDate }: { serverDate: string }) {
  const router = useRouter();
  const lastDate = useRef(serverDate);

  useEffect(() => {
    function checkDate() {
      const current = toIsoDate(new Date());
      if (current !== lastDate.current) {
        lastDate.current = current;
        router.refresh();
      }
    }
    const interval = setInterval(checkDate, 60_000);
    function handleVisibility() { if (document.visibilityState === "visible") checkDate(); }
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", checkDate);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", checkDate);
    };
  }, [router]);

  return null;
}

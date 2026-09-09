"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, MoreVertical, Settings } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { LanguageSwitcher } from "@/components/settings/language-switcher";
import type { SessionLocale } from "@/lib/auth/session";

export function MobileAccountMenu({ isAdmin, language, settingsLabel, logoutLabel, labels }: { isAdmin: boolean; language: SessionLocale; settingsLabel: string; logoutLabel: string; labels: { french: string; english: string; khmer: string } }) {
  const [open, setOpen] = useState(false);

  return <div className="mobile-account-menu">
    <button type="button" className="icon-button" aria-label="Menu du compte" onClick={() => setOpen((value) => !value)}><MoreVertical size={20} /></button>
    {open && <div className="mobile-account-panel">
      {isAdmin && <Link className="nav-link" href="/settings" onClick={() => setOpen(false)}><Settings size={18} /><span>{settingsLabel}</span></Link>}
      <LanguageSwitcher language={language} labels={labels} />
      <form action={logoutAction} style={{ width: "100%" }}>
        <button className="nav-link" type="submit" style={{ width: "100%", border: 0, background: "none", cursor: "pointer" }}><LogOut size={18} /><span>{logoutLabel}</span></button>
      </form>
    </div>}
  </div>;
}

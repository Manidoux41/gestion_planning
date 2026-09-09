"use client";

import { useRef, useTransition } from "react";
import { Languages } from "lucide-react";
import { updateLanguageAction } from "@/app/actions/settings";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher({ language, labels }: { language: Locale; labels: { french: string; english: string; khmer: string } }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const formData = new FormData();
    formData.set("language", event.currentTarget.value);
    startTransition(async () => { await updateLanguageAction(formData); });
  }

  return <form ref={formRef} className="language-switcher"><Languages size={15} /><select name="language" defaultValue={language} onChange={handleChange} disabled={isPending} aria-label="Langue">
    <option value="FR">{labels.french}</option>
    <option value="EN">{labels.english}</option>
    <option value="KM">{labels.khmer}</option>
  </select></form>;
}

import { ChevronRight, Globe2, Home, Wallet } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LanguageSwitcher } from "@/components/settings/language-switcher";
import { FamilyProfileForm } from "@/components/settings/family-profile-form";
import { mockFamily } from "@/lib/db";
import { requireFamilyAdmin } from "@/lib/auth/guard";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";
import { isBlobUploadEnabled } from "@/lib/uploads/store";
import { translator } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SettingsPage() {
  const user = await requireFamilyAdmin();
  const t = translator(user.language);
  const family = (await prismaFamilyRepository.getFamily(user.familyId)) ?? { ...mockFamily, id: user.familyId, name: user.familyName };
  const settings = [
    { key: "family", title: t("settings.family"), description: t("settings.familyDesc"), icon: Home, values: [family.name, family.address || "Adresse à compléter"] },
    { key: "language", title: t("settings.languageCurrency"), description: t("settings.languageCurrencyDesc"), icon: Globe2, values: [`${family.currency} · Dollar américain`] },
    { key: "work", title: t("settings.workPay"), description: t("settings.workPayDesc"), icon: Wallet, values: ["35h par semaine", "Base mensuelle : 330 $"] },
  ];
  return <AppShell activePath="/settings" user={user}><div className="content-wrap app-page"><div className="page-heading"><div><p className="eyebrow">Votre espace</p><h1>{t("settings.title")}</h1><p className="page-subtitle">{t("settings.subtitle")}</p></div></div><section className="settings-list"><FamilyProfileForm family={family} blobEnabled={isBlobUploadEnabled()} />{settings.map((setting) => { const Icon = setting.icon; return <div className="settings-row" key={setting.key}><span className="settings-icon"><Icon size={18} /></span><span><b>{setting.title}</b><small>{setting.description}</small><em>{setting.values.join(" · ")}</em>{setting.key === "language" && <div style={{ marginTop: 10 }}><LanguageSwitcher language={user.language} labels={{ french: t("settings.french"), english: t("settings.english"), khmer: t("settings.khmer") }} /><p className="page-subtitle">{t("settings.languageHint")}</p></div>}</span>{setting.key !== "language" && <ChevronRight size={18} />}</div>; })}</section></div></AppShell>;
}


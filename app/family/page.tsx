import { IdCard, MapPin, Phone } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { FamilyProfileForm } from "@/components/settings/family-profile-form";
import { TelegramCallButton } from "@/components/contact/telegram-call-button";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { requireUser } from "@/lib/auth/guard";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";
import { isBlobUploadEnabled } from "@/lib/uploads/store";
import { googleMapsEmbed, googleMapsLink } from "@/lib/utils/maps";
import { translator } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function FamilyPage() {
  const user = await requireUser();
  const t = translator(user.language);
  const family = await prismaFamilyRepository.getFamily(user.familyId);
  const canEdit = user.role !== "NANNY";

  const address = family?.address ?? "";
  const mapsLink = googleMapsLink(address, family?.latitude ?? null, family?.longitude ?? null);
  const mapsEmbed = googleMapsEmbed(address, family?.latitude ?? null, family?.longitude ?? null);

  return (
    <AppShell activePath="/family" user={user}>
      <div className="content-wrap app-page">
        <div className="page-heading"><div><p className="eyebrow">{t("shell.familySpace")}</p><h1>{t("family.title")}</h1><p className="page-subtitle">{canEdit ? t("family.subtitleAdmin") : t("family.subtitleNanny")}</p></div></div>
        <section className="settings-list">
          <div className="settings-panel">
            <div className="profile-photo-row">
              <ProfileAvatar photoUrl={family?.photoUrl} initials={user.familyName.slice(0, 2).toUpperCase()} />
              <span><b>{user.familyName}</b><br /><small className="page-subtitle">{canEdit ? t("family.editHint") : t("profile.readOnly")}</small></span>
            </div>
            {family?.phone && <div className="entity-detail"><Phone size={15} /><span>{family.phone}</span></div>}
            {address && <div className="entity-detail"><MapPin size={15} /><span>{address}</span></div>}
            {canEdit && family?.idDocument && <div className="entity-detail"><IdCard size={15} /><span>{t("family.idDocument")} : {family.idDocument}</span></div>}
            <div className="card-actions">
              <TelegramCallButton phone={family?.phone} label={t("family.callTelegram")} />
              {mapsLink && <a className="outline-button" href={mapsLink} target="_blank" rel="noopener noreferrer"><MapPin size={15} /> {t("family.viewMap")}</a>}
            </div>
            {mapsEmbed && <iframe className="map-embed" src={mapsEmbed} title={t("family.title")} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />}
          </div>
          {canEdit && family && <FamilyProfileForm family={family} blobEnabled={isBlobUploadEnabled()} />}
        </section>
      </div>
    </AppShell>
  );
}

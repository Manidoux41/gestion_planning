import { redirect } from "next/navigation";
import { MapPin, Phone } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { NannyProfileForm } from "@/components/profile/nanny-profile-form";
import { TelegramCallButton } from "@/components/contact/telegram-call-button";
import { requireUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { googleMapsLink } from "@/lib/utils/maps";
import { isBlobUploadEnabled } from "@/lib/uploads/store";
import { translator } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ProfilePage() {
  const user = await requireUser();
  if (user.role !== "NANNY" || !user.nannyId) redirect("/settings");
  const t = translator(user.language);

  const [nanny, family] = await Promise.all([
    prisma.nanny.findUnique({ where: { id: user.nannyId } }),
    prisma.family.findUnique({ where: { id: user.familyId } }),
  ]);
  if (!nanny) redirect("/");

  const mapsLink = googleMapsLink(family?.address ?? null, family?.latitude ?? null, family?.longitude ?? null);

  return (
    <AppShell activePath="/profile" user={user}>
      <div className="content-wrap app-page">
        <div className="page-heading"><div><p className="eyebrow">{user.familyName}</p><h1>{t("profile.title")}</h1><p className="page-subtitle">{t("profile.subtitle")}</p></div></div>
        <section className="settings-list">
          <NannyProfileForm name={`${nanny.firstName} ${nanny.lastName}`} phone={nanny.phone} address={nanny.address} idDocument={nanny.idDocument} photoUrl={nanny.photoUrl} blobEnabled={isBlobUploadEnabled()} />
          <div className="settings-panel">
            <b>{t("profile.familyContact")}</b>
            {family?.phone && <div className="entity-detail"><Phone size={15} /><span>{family.phone}</span></div>}
            {family?.address && <div className="entity-detail"><MapPin size={15} /><span>{family.address}</span></div>}
            <div className="card-actions">
              <TelegramCallButton phone={family?.phone} label="Appeler la famille sur Telegram" />
              {mapsLink && <a className="outline-button" href={mapsLink} target="_blank" rel="noopener noreferrer"><MapPin size={15} /> Voir le domicile sur Google Maps</a>}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

import { AppShell } from "@/components/layout/app-shell";
import { NannyManager } from "@/components/nanny/nanny-manager";
import { requireFamilyAdmin } from "@/lib/auth/guard";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";
import { isBlobUploadEnabled } from "@/lib/uploads/store";
import { translator } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function NannyPage() {
  const user = await requireFamilyAdmin();
  const t = translator(user.language);
  const nannies = await prismaFamilyRepository.listNannies(user.familyId);
  return <AppShell activePath="/nanny" user={user}><div className="content-wrap app-page"><div className="page-heading"><div><p className="eyebrow">Équipe de la famille</p><h1>{t("nanny.title")}</h1><p className="page-subtitle">{t("nanny.subtitle")}</p></div></div><NannyManager nannies={nannies} blobEnabled={isBlobUploadEnabled()} /></div></AppShell>;
}


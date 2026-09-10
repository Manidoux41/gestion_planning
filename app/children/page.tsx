import { AppShell } from "@/components/layout/app-shell";
import { mockChildren } from "@/lib/db";
import { ChildrenManager } from "@/components/children/children-manager";
import { requireUser } from "@/lib/auth/guard";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";
import { isBlobUploadEnabled } from "@/lib/uploads/store";
import { translator } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ChildrenPage() {
  const user = await requireUser();
  const t = translator(user.language);
  const children = await prismaFamilyRepository.listChildren(user.familyId);
  return <AppShell activePath="/children" user={user}><div className="content-wrap app-page"><div className="page-heading"><div><p className="eyebrow">{user.familyName}</p><h1>{t("children.title")}</h1><p className="page-subtitle">{t("children.subtitle")}</p></div></div><ChildrenManager initialChildren={children.length ? children : mockChildren} canEdit={user.role !== "NANNY"} blobEnabled={isBlobUploadEnabled()} /></div></AppShell>;
}

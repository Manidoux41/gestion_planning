import { AppShell } from "@/components/layout/app-shell";
import { mockChildren } from "@/lib/db";
import { ChildrenManager } from "@/components/children/children-manager";
import { getDemoFamilyContext } from "@/lib/db/demo-context";
import { prismaFamilyRepository } from "@/lib/db/prisma-repository";

export default async function ChildrenPage() {
  const { family } = await getDemoFamilyContext();
  const children = await prismaFamilyRepository.listChildren(family.id);
  return <AppShell activePath="/children"><div className="content-wrap app-page"><div className="page-heading"><div><p className="eyebrow">Famille Martin</p><h1>Les enfants</h1><p className="page-subtitle">Les informations utiles pour accompagner chaque journée.</p></div></div><ChildrenManager initialChildren={children.length ? children : mockChildren} /></div></AppShell>;
}

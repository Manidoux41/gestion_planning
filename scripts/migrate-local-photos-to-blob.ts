import { readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { put } from "@vercel/blob";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../lib/generated/prisma/client";

config({ quiet: true });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const contentTypes: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

async function uploadLocal(photoUrl: string) {
  const relative = photoUrl.replace(/^\//, "");
  const bytes = await readFile(path.join(process.cwd(), "public", relative));
  const blob = await put(relative, bytes, { access: "public", contentType: contentTypes[path.extname(relative).toLowerCase()], addRandomSuffix: true });
  return blob.url;
}

async function main() {
  const [families, nannies, children] = await Promise.all([
    prisma.family.findMany({ where: { photoUrl: { startsWith: "/uploads/" } }, select: { id: true, photoUrl: true } }),
    prisma.nanny.findMany({ where: { photoUrl: { startsWith: "/uploads/" } }, select: { id: true, photoUrl: true } }),
    prisma.child.findMany({ where: { photoUrl: { startsWith: "/uploads/" } }, select: { id: true, photoUrl: true } }),
  ]);

  for (const family of families) {
    const url = await uploadLocal(family.photoUrl!);
    await prisma.family.update({ where: { id: family.id }, data: { photoUrl: url } });
    console.log("Famille migrée:", family.id);
  }
  for (const nanny of nannies) {
    const url = await uploadLocal(nanny.photoUrl!);
    await prisma.nanny.update({ where: { id: nanny.id }, data: { photoUrl: url } });
    console.log("Nounou migrée:", nanny.id);
  }
  for (const child of children) {
    const url = await uploadLocal(child.photoUrl!);
    await prisma.child.update({ where: { id: child.id }, data: { photoUrl: url } });
    console.log("Enfant migré:", child.id);
  }

  console.log(`Terminé: ${families.length + nannies.length + children.length} photo(s) transférée(s) vers Vercel Blob.`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type UploadFolder = "nannies" | "children" | "families";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const UPLOAD_FOLDERS: UploadFolder[] = ["nannies", "children", "families"];

const PUBLIC_ROOT = path.join(process.cwd(), "public", "uploads");

/** Extensions autorisées, indexées par type MIME. Le nom de fichier client n'est jamais réutilisé. */
const allowedTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

/** Signatures binaires vérifiées pour empêcher l'envoi d'un fichier déguisé en image. */
const signatures: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/webp": (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
};

export class UploadError extends Error {}

/** Les envois passent par Vercel Blob dès qu'un jeton est disponible, sinon par le disque local. */
export function isBlobUploadEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** N'accepte que les adresses produites par notre propre pipeline d'upload. */
export function sanitizePhotoUrl(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const candidate = value.trim();
  if (candidate.startsWith("/uploads/") && !candidate.includes("..")) return candidate;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === "https:" && parsed.hostname.endsWith(".public.blob.vercel-storage.com")) return parsed.toString();
  } catch {
    throw new UploadError("Adresse de photo invalide.");
  }
  throw new UploadError("Adresse de photo invalide.");
}

/** Repli de développement : écrit l'image sur le disque après validation complète. */
export async function saveImageToDisk(file: File, folder: UploadFolder): Promise<string> {
  if (file.size === 0) throw new UploadError("Fichier vide.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("La photo ne doit pas dépasser 5 Mo.");

  const extension = allowedTypes[file.type];
  if (!extension) throw new UploadError("Format non supporté. Utilisez une image JPG, PNG ou WEBP.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const matchesSignature = signatures[file.type];
  if (!matchesSignature || !matchesSignature(bytes)) throw new UploadError("Le fichier envoyé n'est pas une image valide.");

  const directory = path.join(PUBLIC_ROOT, folder);
  await mkdir(directory, { recursive: true });
  const fileName = `${randomUUID()}${extension}`;
  await writeFile(path.join(directory, fileName), bytes);
  return `/uploads/${folder}/${fileName}`;
}

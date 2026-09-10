import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type UploadFolder = "nannies" | "children" | "families";

const MAX_BYTES = 4 * 1024 * 1024;
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

/** Enregistre une photo de profil et renvoie son chemin public, ou `null` si aucun fichier n'a été fourni. */
export async function saveImageUpload(value: FormDataEntryValue | null, folder: UploadFolder): Promise<string | null> {
  if (!value || typeof value === "string") return null;
  const file = value;
  if (file.size === 0) return null;
  if (file.size > MAX_BYTES) throw new UploadError("La photo ne doit pas dépasser 4 Mo.");

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

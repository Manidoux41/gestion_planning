"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { ProfileAvatar } from "@/components/ui/profile-avatar";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  folder: "nannies" | "children" | "families";
  blobEnabled: boolean;
  initials: string;
  color?: string;
  currentPhotoUrl?: string | null;
  label?: string;
  required?: boolean;
};

/** Envoie la photo au stockage avant la soumission du formulaire et transmet son URL via un champ caché. */
export function PhotoUploadField({ folder, blobEnabled, initials, color, currentPhotoUrl, label = "Photo de profil (JPG, PNG ou WEBP — 5 Mo max)", required = false }: Props) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl ?? null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!ALLOWED.includes(file.type)) { setError("Format non supporté. Utilisez une image JPG, PNG ou WEBP."); return; }
    if (file.size > MAX_BYTES) { setError("La photo ne doit pas dépasser 5 Mo."); return; }

    setIsUploading(true);
    try {
      let url: string;
      if (blobEnabled) {
        const blob = await upload(`uploads/${folder}/${file.name}`, file, { access: "public", handleUploadUrl: "/api/photos/upload" });
        url = blob.url;
      } else {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch(`/api/photos/local?folder=${folder}`, { method: "POST", body });
        const payload = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !payload.url) throw new Error(payload.error ?? "Envoi impossible.");
        url = payload.url;
      }
      setPhotoUrl(url);
      setPreview(url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Envoi impossible.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="profile-photo-row">
      <ProfileAvatar photoUrl={preview} initials={initials} color={color} />
      <div style={{ flex: 1 }}>
        <label>{label}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleChange(event.target.files?.[0])} /></label>
        <input type="hidden" name="photoUrl" value={photoUrl} required={required} />
        {isUploading && <p className="page-subtitle">Envoi de la photo...</p>}
        {error && <p className="form-error">{error}</p>}
      </div>
    </div>
  );
}

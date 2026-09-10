import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isBlobUploadEnabled, saveImageToDisk, UploadError, UPLOAD_FOLDERS, type UploadFolder } from "@/lib/uploads/store";

export const runtime = "nodejs";

/** Repli utilisé uniquement en local, quand aucun store Vercel Blob n'est configuré. */
export async function POST(request: Request): Promise<NextResponse> {
  if (isBlobUploadEnabled()) return NextResponse.json({ error: "Utilisez l'envoi direct vers Vercel Blob." }, { status: 400 });

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const folder = new URL(request.url).searchParams.get("folder");
  if (!folder || !UPLOAD_FOLDERS.includes(folder as UploadFolder)) return NextResponse.json({ error: "Destination inconnue." }, { status: 400 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });

  try {
    const url = await saveImageToDisk(file, folder as UploadFolder);
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof UploadError ? error.message : "Envoi impossible." }, { status: 400 });
  }
}

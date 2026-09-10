import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";

export type SessionRole = "OWNER" | "ADMIN" | "NANNY";
export type SessionLocale = "FR" | "EN" | "KM";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: SessionRole;
  familyId: string;
  familyName: string;
  familyPhotoUrl: string | null;
  nannyId: string | null;
  initials: string;
  language: SessionLocale;
};

const COOKIE_NAME = "session_token";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function initialsOf(name: string) {
  return name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "?";
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await prisma.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { nanny: true, families: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  const { user } = session;

  if (user.role === "NANNY") {
    if (!user.nanny) return null;
    const family = await prisma.family.findUnique({ where: { id: user.nanny.familyId } });
    if (!family) return null;
    return { id: user.id, name: user.name, email: user.email, role: "NANNY", familyId: family.id, familyName: family.name, familyPhotoUrl: family.photoUrl, nannyId: user.nanny.id, initials: initialsOf(user.name), language: family.language };
  }

  const family = user.families[0];
  if (!family) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role, familyId: family.id, familyName: family.name, familyPhotoUrl: family.photoUrl, nannyId: null, initials: initialsOf(user.name), language: family.language };
}

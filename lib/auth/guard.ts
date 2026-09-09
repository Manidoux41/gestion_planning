import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./session";

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireFamilyAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role === "NANNY") redirect("/");
  return user;
}

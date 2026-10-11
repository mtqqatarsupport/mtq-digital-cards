import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { adminAuth } from "./firebase-admin";
import { isAllowedAdmin, SESSION_COOKIE } from "./admins";

export type Admin = { uid: string; email: string; name: string };

/**
 * Verifies the Firebase session cookie (signature, expiry AND revocation) and
 * re-checks the email against the allow-list on every request.
 */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const t = await adminAuth().verifySessionCookie(raw, true);
    if (!t.email || t.email_verified !== true || !isAllowedAdmin(t.email)) return null;
    if (t.firebase?.sign_in_provider !== "google.com") return null;
    return { uid: t.uid, email: t.email.toLowerCase(), name: typeof t.name === "string" ? t.name : t.email };
  } catch {
    return null;
  }
});

export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

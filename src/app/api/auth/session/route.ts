import { NextResponse, type NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { isAllowedAdmin, SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/admins";
import { audit } from "@/lib/audit";
import { baseUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const deny = (status: number, error: string) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const allowed = new Set([new URL(baseUrl()).origin, req.nextUrl.origin]);
  return allowed.has(origin);
}

// Exchange a fresh Firebase ID token (from Google sign-in in the browser) for an
// HttpOnly session cookie — only for allow-listed, verified Google accounts.
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return deny(403, "bad_origin");
  if (!req.headers.get("content-type")?.includes("application/json")) return deny(415, "bad_request");
  let idToken = "";
  try {
    const body = (await req.json()) as { idToken?: unknown };
    idToken = typeof body.idToken === "string" ? body.idToken.slice(0, 4096) : "";
  } catch { /* fall through */ }
  if (!idToken) return deny(400, "bad_request");

  const auth = adminAuth();
  let t;
  try {
    t = await auth.verifyIdToken(idToken, true);
  } catch {
    return deny(401, "invalid_token");
  }

  const email = t.email?.toLowerCase() ?? "";
  const recent = Date.now() / 1000 - t.auth_time < 5 * 60;
  if (t.firebase?.sign_in_provider !== "google.com" || t.email_verified !== true || !isAllowedAdmin(email)) {
    await audit(email || null, "login.denied", email || t.uid);
    // Don't keep stray Firebase users for people who aren't admins.
    try { await auth.deleteUser(t.uid); } catch { /* ignore */ }
    return deny(403, "not_admin");
  }
  if (!recent) return deny(401, "stale_login");

  const cookie = await auth.createSessionCookie(idToken, { expiresIn: SESSION_TTL_MS });
  await audit(email, "login.google");
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(SESSION_COOKIE, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return res;
}

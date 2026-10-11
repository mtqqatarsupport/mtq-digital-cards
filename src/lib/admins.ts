// ─────────────────────────────────────────────────────────────────────────────
// The ONLY Google accounts allowed into the admin portal.
// To add or remove someone, edit this list, commit and redeploy.
// ─────────────────────────────────────────────────────────────────────────────
export const ALLOWED_ADMIN_EMAILS: readonly string[] = [
  "christianmarana@gmail.com",
  "mtqqatarsupport@gmail.com",
];

export const isAllowedAdmin = (email: string | undefined | null) =>
  !!email && ALLOWED_ADMIN_EMAILS.includes(email.trim().toLowerCase());

export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-mtq_session" : "mtq_session";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

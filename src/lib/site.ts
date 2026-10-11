import "server-only";

export { getSettings } from "./store";

/** Canonical public base URL — never derived from the (spoofable) Host header. */
export function baseUrl() {
  const fromEnv = process.env.APP_URL?.replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export const cardUrl = (slug: string) => `${baseUrl()}/${slug}`;

export const imgSrc = (id: string | null | undefined) => (id ? `/api/img/${id}` : null);

/** Uploaded logo if there is one, otherwise the bundled MechaTronics logo. */
export const logoSrc = (s: { logoId: string | null }) => imgSrc(s.logoId) ?? "/brand/logo.png";

export const mapsHref = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

export function telHref(n: string) {
  return `tel:${n.replace(/[^0-9+]/g, "")}`;
}

/** Firestore auto-generated document ids. */
export const isDocId = (id: string) => /^[A-Za-z0-9]{20}$/.test(id);

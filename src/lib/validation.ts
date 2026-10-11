import { z } from "zod";

// Paths that a card slug may never take over.
export const RESERVED_SLUGS = new Set([
  "admin", "api", "setup", "login", "logout", "_next", "static", "public", "img", "images",
  "favicon.ico", "robots.txt", "sitemap.xml", "vcard", "qr", "settings", "new",
  "brand", "icon.png", "apple-icon.png", "__",
]);

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Only http(s) links survive; adds https:// when the scheme is missing. Blocks javascript:, data:, etc. */
export function safeUrl(input: string): string | null {
  const v = input.trim();
  if (!v) return "";
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

const trimmed = (max: number) => z.string().trim().max(max);
const phone = z
  .string()
  .trim()
  .max(30)
  .refine((v) => v === "" || /^\+?[0-9 ()-]{6,30}$/.test(v), "Use digits, spaces, + ( ) - only");
const url = z
  .string()
  .max(300)
  .transform((v, ctx) => {
    const s = safeUrl(v);
    if (s === null) {
      ctx.addIssue({ code: "custom", message: "Enter a valid http(s) link" });
      return z.NEVER;
    }
    return s;
  });

export const cardSchema = z.object({
  fullName: trimmed(80).min(2, "Name is required"),
  jobTitle: trimmed(80).min(2, "Position is required"),
  department: trimmed(30),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(60)
    .refine((v) => v === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), "Lowercase letters, numbers and dashes only")
    .refine((v) => !RESERVED_SLUGS.has(v), "This link name is reserved"),
  mobile: phone,
  phone: phone,
  whatsapp: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v === "" || (v.length >= 8 && v.length <= 15), "WhatsApp needs country code + number, e.g. 97433775853"),
  email: z.union([z.literal(""), z.string().trim().toLowerCase().max(120).email("Enter a valid email")]),
  website: url,
  linkedin: url,
  isActive: z.boolean(),
});
export type CardInput = z.infer<typeof cardSchema>;

export const settingsSchema = z.object({
  companyName: trimmed(80).min(2, "Company name is required"),
  tagline: trimmed(120),
  website: url,
  officePhone: phone,
  address: trimmed(160),
  accent: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #E3AE6A"),
});


export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const k = String(issue.path[0] ?? "form");
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}

/** Strict colour validation for anything injected into a style attribute. */
export function safeColor(c: string | null | undefined, fallback = "#E3AE6A") {
  return c && /^#[0-9a-fA-F]{6}$/.test(c) ? c : fallback;
}

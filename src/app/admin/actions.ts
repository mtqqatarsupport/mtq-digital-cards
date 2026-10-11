"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase-admin";
import { SESSION_COOKIE } from "@/lib/admins";
import { audit } from "@/lib/audit";
import { getAdmin, requireAdmin } from "@/lib/auth";
import { deleteImage, ImageError, storeImage } from "@/lib/images";
import { isDocId } from "@/lib/site";
import { deleteCard, getCard, getSettings, saveCard, saveSettings, slugTaken, SlugTakenError } from "@/lib/store";
import { cardSchema, fieldErrors, RESERVED_SLUGS, settingsSchema, slugify } from "@/lib/validation";

export type FormState = { ok?: boolean; message?: string; errors?: Record<string, string>; values?: Record<string, string | boolean> };

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v : "";
};
const file = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return v instanceof File && v.size > 0 ? v : null;
};

// ───────────────────────── Sign out ─────────────────────────

export async function logoutAction() {
  const admin = await getAdmin();
  if (admin) {
    // Revoke every session for this account (sign out everywhere).
    try { await adminAuth().revokeRefreshTokens(admin.uid); } catch { /* ignore */ }
    await audit(admin.email, "logout");
  }
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

// ───────────────────────── Cards ─────────────────────────

const CARD_FIELDS = ["fullName", "jobTitle", "department", "slug", "mobile", "phone", "whatsapp", "email", "website", "linkedin"] as const;

async function freeSlug(wanted: string, excludeId?: string) {
  let base = wanted || "card";
  if (RESERVED_SLUGS.has(base)) base = `${base}-card`;
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    if (!(await slugTaken(candidate, excludeId))) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function saveCardAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = str(fd, "id") || undefined;
  const echo = (): Record<string, string | boolean> => ({
    ...Object.fromEntries(CARD_FIELDS.map((k) => [k, str(fd, k).slice(0, 300)])),
    isActive: fd.get("isActive") === "on",
  });
  const parsed = cardSchema.safeParse({ ...Object.fromEntries(CARD_FIELDS.map((k) => [k, str(fd, k)])), isActive: fd.get("isActive") === "on" });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: echo() };
  const data = parsed.data;

  if (id && !isDocId(id)) return { message: "Card not found." };
  const existing = id ? await getCard(id) : null;
  if (id && !existing) return { message: "Card not found." };

  const slug = data.slug || (await freeSlug(slugify(data.fullName), id));

  let photoId = existing?.photoId ?? null;
  let uploaded: string | null = null;
  try {
    const upload = file(fd, "photo");
    if (upload) photoId = uploaded = await storeImage(upload, "photo");
    else if (fd.get("removePhoto") === "on") photoId = null;
  } catch (e) {
    return { errors: { photo: e instanceof ImageError ? e.message : "Upload failed" }, values: echo() };
  }

  let savedId: string;
  try {
    savedId = await saveCard(id, { ...data, slug, photoId });
  } catch (e) {
    if (uploaded) await deleteImage(uploaded);
    if (e instanceof SlugTakenError) return { errors: { slug: "This link is already used by another card" }, values: echo() };
    throw e;
  }
  if (existing?.photoId && existing.photoId !== photoId) await deleteImage(existing.photoId);
  await audit(admin.email, existing ? "card.update" : "card.create", `${data.fullName} (${slug})`);
  revalidatePath("/admin");
  redirect(`/admin/cards/${savedId}?saved=1`);
}

export async function deleteCardAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const card = isDocId(id) ? await getCard(id) : null;
  if (card) {
    await deleteCard(card.id);
    await deleteImage(card.photoId);
    await audit(admin.email, "card.delete", `${card.fullName} (${card.slug})`);
  }
  revalidatePath("/admin");
  redirect("/admin");
}

// ───────────────────────── Branding ─────────────────────────

export async function saveSettingsAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = settingsSchema.safeParse({
    companyName: str(fd, "companyName"),
    tagline: str(fd, "tagline"),
    website: str(fd, "website"),
    officePhone: str(fd, "officePhone"),
    address: str(fd, "address"),
    accent: str(fd, "accent"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const current = await getSettings();
  let logoId = current.logoId;
  try {
    const upload = file(fd, "logo");
    if (upload) logoId = await storeImage(upload, "logo");
    else if (fd.get("removeLogo") === "on") logoId = null;
  } catch (e) {
    return { errors: { logo: e instanceof ImageError ? e.message : "Upload failed" } };
  }

  await saveSettings({ ...parsed.data, logoId });
  if (current.logoId && current.logoId !== logoId) await deleteImage(current.logoId);
  await audit(admin.email, "settings.update");
  revalidatePath("/", "layout");
  return { ok: true, message: "Branding saved." };
}

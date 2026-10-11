import "server-only";
import { cache } from "react";
import { FieldValue, Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import { firestore } from "./firebase-admin";

// All database access lives here. Firestore collections:
//   cards/{id}          one business card
//   images/{id}         re-encoded photos/logos (bytes, < 1 MB each)
//   settings/company    company branding (single document)
//   audit_logs/{id}     sign-ins and changes

export type Card = {
  id: string; slug: string; isActive: boolean; fullName: string; jobTitle: string; department: string;
  phone: string; mobile: string; whatsapp: string; email: string; website: string; linkedin: string;
  photoId: string | null; views: number; createdAt: Date; updatedAt: Date;
};
export type CardInput = Omit<Card, "id" | "views" | "createdAt" | "updatedAt">;

export type Settings = {
  companyName: string; tagline: string; website: string; officePhone: string; address: string; accent: string;
  logoId: string | null;
};

export type StoredImage = { mime: string; data: Buffer; width: number; height: number };
export type AuditEntry = { id: string; who: string; action: string; target: string; ip: string; at: Date };

export class SlugTakenError extends Error {}

export const DEFAULT_SETTINGS: Settings = {
  companyName: "MechaTronics W.L.L",
  tagline: "Electromechanical Contractors · Doha, Qatar",
  website: "https://www.mechatronics.com.qa",
  officePhone: "+974 4464 9172",
  address: "P.O. Box 37269, Doha, Qatar",
  accent: "#E3AE6A",
  logoId: null,
};

const cards = () => firestore().collection("cards");
const images = () => firestore().collection("images");
const settingsDoc = () => firestore().collection("settings").doc("company");
const audits = () => firestore().collection("audit_logs");

const toDate = (v: unknown) => (v instanceof Timestamp ? v.toDate() : new Date(0));
const s = (v: unknown) => (typeof v === "string" ? v : "");

function toCard(d: DocumentSnapshot): Card {
  const x = d.data() ?? {};
  return {
    id: d.id, slug: s(x.slug), isActive: x.isActive !== false, fullName: s(x.fullName), jobTitle: s(x.jobTitle),
    department: s(x.department), phone: s(x.phone), mobile: s(x.mobile), whatsapp: s(x.whatsapp), email: s(x.email),
    website: s(x.website), linkedin: s(x.linkedin), photoId: typeof x.photoId === "string" ? x.photoId : null,
    views: typeof x.views === "number" ? x.views : 0, createdAt: toDate(x.createdAt), updatedAt: toDate(x.updatedAt),
  };
}

// ── Cards ──
export async function listCards(): Promise<Card[]> {
  const snap = await cards().orderBy("updatedAt", "desc").get();
  return snap.docs.map(toCard);
}

export async function getCard(id: string): Promise<Card | null> {
  const d = await cards().doc(id).get();
  return d.exists ? toCard(d) : null;
}

export async function getCardBySlug(slug: string): Promise<Card | null> {
  const snap = await cards().where("slug", "==", slug).limit(1).get();
  return snap.empty ? null : toCard(snap.docs[0]);
}

export async function slugTaken(slug: string, excludeId?: string) {
  const snap = await cards().where("slug", "==", slug).limit(2).get();
  return snap.docs.some((d) => d.id !== excludeId);
}

/** Creates or updates a card; the slug check and write happen in one transaction. */
export async function saveCard(id: string | undefined, data: CardInput): Promise<string> {
  const db = firestore();
  return db.runTransaction(async (tx) => {
    const clash = await tx.get(cards().where("slug", "==", data.slug).limit(2));
    if (clash.docs.some((d) => d.id !== id)) throw new SlugTakenError(data.slug);
    const now = FieldValue.serverTimestamp();
    if (id) {
      const ref = cards().doc(id);
      tx.update(ref, { ...data, updatedAt: now });
      return id;
    }
    const ref = cards().doc();
    tx.set(ref, { ...data, views: 0, createdAt: now, updatedAt: now });
    return ref.id;
  });
}

export async function deleteCard(id: string) {
  await cards().doc(id).delete();
}

export async function incrementViews(id: string) {
  await cards().doc(id).update({ views: FieldValue.increment(1) });
}

// ── Settings ──
export const getSettings = cache(async (): Promise<Settings> => {
  const d = await settingsDoc().get();
  const x = d.data() ?? {};
  return {
    companyName: s(x.companyName) || DEFAULT_SETTINGS.companyName,
    tagline: typeof x.tagline === "string" ? x.tagline : DEFAULT_SETTINGS.tagline,
    website: typeof x.website === "string" ? x.website : DEFAULT_SETTINGS.website,
    officePhone: typeof x.officePhone === "string" ? x.officePhone : DEFAULT_SETTINGS.officePhone,
    address: typeof x.address === "string" ? x.address : DEFAULT_SETTINGS.address,
    accent: s(x.accent) || DEFAULT_SETTINGS.accent,
    logoId: typeof x.logoId === "string" ? x.logoId : null,
  };
});

export async function saveSettings(v: Settings) {
  await settingsDoc().set({ ...v, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

// ── Images ──
export async function putImage(img: StoredImage): Promise<string> {
  const ref = images().doc();
  await ref.set({ ...img, createdAt: FieldValue.serverTimestamp() });
  return ref.id;
}

export async function getImage(id: string): Promise<StoredImage | null> {
  const d = await images().doc(id).get();
  const x = d.data();
  if (!x || !Buffer.isBuffer(x.data)) return null;
  return { mime: s(x.mime), data: x.data, width: Number(x.width) || 0, height: Number(x.height) || 0 };
}

export async function deleteImage(id: string | null | undefined) {
  if (id) await images().doc(id).delete();
}

// ── Audit log ──
export async function addAudit(e: Omit<AuditEntry, "id" | "at">) {
  await audits().add({ ...e, at: FieldValue.serverTimestamp() });
}

export async function listAudit(limit = 200): Promise<AuditEntry[]> {
  const snap = await audits().orderBy("at", "desc").limit(limit).get();
  return snap.docs.map((d) => {
    const x = d.data();
    return { id: d.id, who: s(x.who), action: s(x.action), target: s(x.target), ip: s(x.ip), at: toDate(x.at) };
  });
}

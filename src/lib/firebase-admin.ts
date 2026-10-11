import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Server-side Firebase (service account). Credentials come from Vercel env vars, either:
//   FIREBASE_SERVICE_ACCOUNT  = the whole downloaded .json file pasted as-is   (easiest)
// or the three separate values:
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// Optional: FIRESTORE_DATABASE_ID if you created a named database instead of "(default)".

let app: App | undefined;
let fs: Firestore | undefined;

/** Repairs the usual copy/paste damage: wrapping quotes, literal \n, Windows line endings. */
function cleanKey(raw: string) {
  let k = raw.trim();
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) k = k.slice(1, -1);
  return k.replace(/\\n/g, "\n").replace(/\r/g, "").trim() + "\n";
}

export function serviceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (json) {
    try {
      const sa = JSON.parse(json) as { project_id?: string; client_email?: string; private_key?: string };
      return { projectId: sa.project_id ?? "", clientEmail: sa.client_email ?? "", privateKey: cleanKey(sa.private_key ?? "") };
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON — paste the entire downloaded .json file");
    }
  }
  const pk = process.env.FIREBASE_PRIVATE_KEY ?? "";
  // People sometimes paste the whole JSON file into FIREBASE_PRIVATE_KEY — accept that too.
  if (pk.trim().startsWith("{")) {
    try {
      const sa = JSON.parse(pk) as { project_id?: string; client_email?: string; private_key?: string };
      return {
        projectId: process.env.FIREBASE_PROJECT_ID || sa.project_id || "",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || sa.client_email || "",
        privateKey: cleanKey(sa.private_key ?? ""),
      };
    } catch { /* fall through */ }
  }
  return {
    projectId: (process.env.FIREBASE_PROJECT_ID ?? "").trim().replace(/^"|"$/g, ""),
    clientEmail: (process.env.FIREBASE_CLIENT_EMAIL ?? "").trim().replace(/^"|"$/g, ""),
    privateKey: pk ? cleanKey(pk) : "",
  };
}

function firebaseApp(): App {
  if (app) return app;
  const existing = getApps()[0];
  if (existing) return (app = existing);
  const { projectId, clientEmail, privateKey } = serviceAccount();
  if (!projectId || !clientEmail || !privateKey.includes("PRIVATE KEY")) {
    throw new Error("Firebase is not configured: set FIREBASE_SERVICE_ACCOUNT (or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY) in Vercel");
  }
  return (app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId }));
}

export function firestore(): Firestore {
  if (fs) return fs;
  const dbId = process.env.FIRESTORE_DATABASE_ID?.trim();
  fs = dbId && dbId !== "(default)" ? getFirestore(firebaseApp(), dbId) : getFirestore(firebaseApp());
  fs.settings({ ignoreUndefinedProperties: true });
  return fs;
}

export const adminAuth = () => getAuth(firebaseApp());

/** Project id for client config fallback. */
export const firebaseProjectId = () => {
  try { return serviceAccount().projectId; } catch { return ""; }
};

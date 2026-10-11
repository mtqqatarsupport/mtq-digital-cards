import { firestore, serviceAccount } from "@/lib/firebase-admin";
import { firebaseWebConfig } from "@/lib/firebase-web";

export const dynamic = "force-dynamic";

// Setup check: says WHICH setting is missing or wrong — never any secret values.
export async function GET() {
  const has = (k: string) => Boolean(process.env[k]?.trim());
  const env = {
    FIREBASE_SERVICE_ACCOUNT: has("FIREBASE_SERVICE_ACCOUNT"),
    FIREBASE_PROJECT_ID: has("FIREBASE_PROJECT_ID"),
    FIREBASE_CLIENT_EMAIL: has("FIREBASE_CLIENT_EMAIL"),
    FIREBASE_PRIVATE_KEY: has("FIREBASE_PRIVATE_KEY"),
    FIREBASE_WEB_API_KEY: has("FIREBASE_WEB_API_KEY"),
    FIREBASE_AUTH_DOMAIN: has("FIREBASE_AUTH_DOMAIN"),
    FIREBASE_WEB_APP_ID: has("FIREBASE_WEB_APP_ID"),
    APP_URL: has("APP_URL"),
  };
  let credentials = "ok";
  try {
    const sa = serviceAccount();
    if (!sa.projectId) credentials = "missing project id";
    else if (!sa.clientEmail) credentials = "missing client email";
    else if (!sa.privateKey.includes("-----BEGIN PRIVATE KEY-----")) credentials = "private key missing or not in PEM format";
  } catch (e) {
    credentials = (e as Error).message;
  }
  let database = "not checked";
  if (credentials === "ok") {
    try {
      await firestore().collection("settings").doc("company").get();
      database = "ok";
    } catch (e) {
      const err = e as { code?: number | string; message?: string };
      const msg = String(err.message ?? "");
      database =
        err.code === 5 || /NOT_FOUND/.test(msg) ? "Firestore database not found — create it in Firebase → Firestore Database" :
        err.code === 7 || /PERMISSION_DENIED/.test(msg) ? "permission denied — the service account key doesn't belong to this project, or Firestore API is disabled" :
        /DECODER|PEM|private key|asn1|routines/i.test(msg) ? "private key is damaged — paste it again (or use FIREBASE_SERVICE_ACCOUNT)" :
        /invalid_grant|account not found/i.test(msg) ? "key was deleted/revoked or client email is wrong — generate a new private key" :
        `error: ${msg.slice(0, 160)}`;
    }
  }
  const web = firebaseWebConfig();
  const googleSignIn = web.apiKey && web.authDomain && web.appId ? `ok (${web.authDomain})` : "missing web app settings";
  const ok = credentials === "ok" && database === "ok" && googleSignIn.startsWith("ok");
  return Response.json({ ok, credentials, database, googleSignIn, env }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}

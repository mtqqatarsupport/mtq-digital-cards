import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { getSettings, logoSrc } from "@/lib/site";
import { firebaseProjectId } from "@/lib/firebase-admin";
import { GoogleSignIn, type FirebaseWebConfig } from "./GoogleSignIn";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in — Digital Cards" };

function webConfig(): FirebaseWebConfig | null {
  const c = {
    apiKey: process.env.FIREBASE_WEB_API_KEY ?? "",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.FIREBASE_PROJECT_ID || firebaseProjectId(),
    appId: process.env.FIREBASE_WEB_APP_ID ?? "",
  };
  return c.apiKey && c.authDomain && c.projectId && c.appId ? c : null;
}

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  const s = await getSettings().catch(() => null);
  const config = webConfig();
  if (!s) {
    return (
      <main className="center-page auth-bg">
        <div className="panel narrow stack" style={{ textAlign: "center" }}>
          <h1 className="h2">Can&apos;t reach the database</h1>
          <p className="muted small">The Firebase settings in Vercel are missing or incorrect. Open <a href="/api/health" className="ic-mint">/api/health</a> to see exactly which one.</p>
        </div>
      </main>
    );
  }
  return (
    <main className="center-page auth-bg">
      <div className="panel narrow stack">
        <div className="auth-brand"><span className="vc-logo"><img src={logoSrc(s)} alt={s.companyName} /></span></div>
        <div className="auth-head">
          <h1 className="h2">Digital Cards</h1>
          <p className="muted small">{s.companyName} · Admin portal</p>
        </div>
        {config ? <GoogleSignIn config={config} /> : <p className="notice notice-err">Google sign-in isn&apos;t configured yet. Add the Firebase settings in Vercel.</p>}
        <p className="field-hint" style={{ textAlign: "center" }}>Access is limited to approved administrator accounts.</p>
      </div>
    </main>
  );
}

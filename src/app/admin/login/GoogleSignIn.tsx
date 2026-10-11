"use client";
import { useEffect, useRef, useState } from "react";
import type { Auth } from "@firebase/auth";
import { GoogleG } from "@/components/GoogleG";

export type FirebaseWebConfig = { apiKey: string; authDomain: string; projectId: string; appId: string };

const MESSAGES: Record<string, string> = {
  not_admin: "This Google account doesn't have access. Only approved MechaTronics admins can sign in.",
  stale_login: "That sign-in took too long. Please try again.",
  invalid_token: "Google sign-in couldn't be verified. Please try again.",
  bad_origin: "Sign-in was blocked for security reasons. Open the portal from its normal address.",
};

export function GoogleSignIn({ config }: { config: FirebaseWebConfig }) {
  const authRef = useRef<Auth | null>(null);
  const modsRef = useRef<typeof import("@firebase/auth") | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Load Firebase ahead of the click so the Google popup opens instantly
  // (browsers block popups that open after an async delay).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ initializeApp, getApps }, authMod] = await Promise.all([import("@firebase/app"), import("@firebase/auth")]);
      const app = getApps()[0] ?? initializeApp(config);
      const auth = authMod.getAuth(app);
      await authMod.setPersistence(auth, authMod.inMemoryPersistence); // the browser keeps no Firebase login
      if (cancelled) return;
      authRef.current = auth;
      modsRef.current = authMod;
      setReady(true);
    })().catch(() => setError("Couldn't load Google sign-in. Check your connection and reload."));
    return () => { cancelled = true; };
  }, [config]);

  async function signIn() {
    const auth = authRef.current;
    const m = modsRef.current;
    if (!auth || !m) return;
    setError("");
    const provider = new m.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    let idToken: string;
    try {
      const cred = await m.signInWithPopup(auth, provider);
      idToken = await cred.user.getIdToken();
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setError(code === "auth/popup-blocked" ? "Your browser blocked the Google window. Allow pop-ups for this site and try again." : "Google sign-in didn't complete. Please try again.");
      }
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        credentials: "same-origin",
      });
      if (res.ok) {
        window.location.assign("/admin");
        return;
      }
      const { error: code } = (await res.json().catch(() => ({}))) as { error?: string };
      setError(MESSAGES[code ?? ""] ?? "Sign-in failed. Please try again.");
    } finally {
      await m.signOut(auth).catch(() => {});
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      {error && <p className="notice notice-err" role="alert">{error}</p>}
      <button type="button" className="btn btn-google btn-lg btn-block" onClick={signIn} disabled={!ready || busy} aria-busy={busy}>
        <GoogleG /> {busy ? "Signing you in…" : "Continue with Google"}
      </button>
    </div>
  );
}

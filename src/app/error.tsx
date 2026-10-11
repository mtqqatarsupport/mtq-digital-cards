"use client";

export default function Error({ error }: { error: Error & { digest?: string } }) {
  return (
    <main className="center-page auth-bg">
      <div className="panel narrow" style={{ textAlign: "center" }}>
        <h1 className="h2">Something went wrong</h1>
        <p className="muted">Please try again in a moment.</p>
        <p className="field-hint">Admins: open <code>/api/health</code> to check the setup.{error.digest ? ` Ref ${error.digest}` : ""}</p>
      </div>
    </main>
  );
}

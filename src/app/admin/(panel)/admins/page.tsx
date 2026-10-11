import { ALLOWED_ADMIN_EMAILS } from "@/lib/admins";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Admins — Digital Cards Admin" };

export default async function AdminsPage() {
  const me = await requireAdmin();
  return (
    <>
      <div className="page-head"><div><h1 className="h1">Admins</h1><p className="muted">Google accounts that can sign in to this portal.</p></div></div>
      <div className="panel" style={{ maxWidth: 640 }}>
        <ul className="plain-list">
          {ALLOWED_ADMIN_EMAILS.map((e) => (
            <li key={e} className="admin-row">
              <div><strong>{e}</strong>{e === me.email && <span className="pill pill-on">You</span>}</div>
              <span className="pill pill-gold">Google</span>
            </li>
          ))}
        </ul>
        <p className="field-hint" style={{ marginTop: 14 }}>
          This list is fixed in the code (<code>src/lib/admins.ts</code>) so nobody can grant themselves access from the portal.
          To change it, edit that file and redeploy. Signing out from here signs you out on every device.
        </p>
      </div>
    </>
  );
}

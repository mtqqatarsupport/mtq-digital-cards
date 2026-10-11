import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getSettings, logoSrc } from "@/lib/site";
import { NavLinks } from "@/components/NavLinks";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const s = await getSettings();
  return (
    <div className="admin">
      <header className="admin-top">
        <Link href="/admin" className="admin-brand">
          <span className="vc-logo"><img src={logoSrc(s)} alt="" /></span>
          <span>Digital Cards</span>
        </Link>
        <NavLinks />
        <form action={logoutAction} className="admin-user">
          <span className="small">{admin.name}</span>
          <button className="btn btn-dark btn-sm" type="submit">Sign out</button>
        </form>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}

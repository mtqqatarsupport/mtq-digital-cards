"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Cards" },
  { href: "/admin/settings", label: "Branding" },
  { href: "/admin/admins", label: "Admins" },
  { href: "/admin/activity", label: "Activity" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="admin-nav">
      {links.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" || path.startsWith("/admin/cards") : path.startsWith(l.href);
        return <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>{l.label}</Link>;
      })}
    </nav>
  );
}

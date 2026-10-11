import Link from "next/link";
import { listCards } from "@/lib/store";
import { cardUrl, imgSrc, initials } from "@/lib/site";
import { Icon } from "@/components/Icon";
import { CopyButton } from "@/components/forms";

export const metadata = { title: "Cards — Digital Cards Admin" };

export default async function CardsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.trim().slice(0, 60);
  const needle = term.toLowerCase();
  const rows = (await listCards()).filter((c) =>
    !needle || [c.fullName, c.jobTitle, c.department, c.slug].some((f) => f.toLowerCase().includes(needle)),
  );
  const totalViews = rows.reduce((n, r) => n + r.views, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="h1">Business cards</h1>
          <p className="muted">{rows.length} {rows.length === 1 ? "card" : "cards"} · {totalViews} total opens</p>
        </div>
        <Link href="/admin/cards/new" className="btn btn-gold"><Icon name="plus" size={18} /> New card</Link>
      </div>

      <form className="search" role="search">
        <Icon name="search" size={18} />
        <input name="q" defaultValue={term} placeholder="Search name, position, department" maxLength={60} />
      </form>

      {rows.length === 0 ? (
        <div className="panel empty">
          <p className="h2">{term ? "No matches" : "No cards yet"}</p>
          {!term && <p className="muted">Create the first card for your team.</p>}
          {!term && <Link href="/admin/cards/new" className="btn btn-gold">Create a card</Link>}
        </div>
      ) : (
        <ul className="card-list">
          {rows.map((c) => (
            <li key={c.id} className={`card-tile${c.isActive ? "" : " off"}`}>
              <div className="tile-photo">{c.photoId ? <img src={imgSrc(c.photoId)!} alt="" /> : initials(c.fullName)}</div>
              <div className="tile-main">
                <Link href={`/admin/cards/${c.id}`} className="tile-name">{c.fullName}</Link>
                <span className="tile-role">{c.jobTitle}</span>
                <span className="small muted">{c.department || "—"}</span>
                <span className="tile-meta">
                  <span className={`pill ${c.isActive ? "pill-on" : "pill-off"}`} style={{ marginLeft: 0 }}>{c.isActive ? "● Live" : "Off"}</span>
                  <span><Icon name="eye" size={14} /> {c.views}</span>
                  <span className="mono">/{c.slug}</span>
                </span>
              </div>
              <div className="tile-actions">
                <CopyButton text={cardUrl(c.slug)} label="Link" />
                <a className="btn btn-dark btn-sm" href={`/${c.slug}`} target="_blank" rel="noopener noreferrer"><Icon name="external" size={15} /> View</a>
                <Link className="btn btn-dark btn-sm" href={`/admin/cards/${c.id}`}><Icon name="edit" size={15} /> Edit</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

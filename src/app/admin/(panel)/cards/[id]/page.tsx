import Link from "next/link";
import { notFound } from "next/navigation";
import { getCard } from "@/lib/store";
import { baseUrl, cardUrl, imgSrc, isDocId } from "@/lib/site";
import { brandedQrSvg } from "@/lib/qr";
import { CardForm } from "@/components/CardForm";
import { ConfirmSubmit, CopyButton } from "@/components/forms";
import { Icon } from "@/components/Icon";
import { deleteCardAction } from "../../../actions";

export const metadata = { title: "Edit card — Digital Cards Admin" };

export default async function EditCardPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const { saved } = await searchParams;
  const c = isDocId(id) ? await getCard(id) : null;
  if (!c) notFound();
  const url = cardUrl(c.slug);
  const qr = await brandedQrSvg(url);

  return (
    <>
      <div className="page-head">
        <div>
          <Link href="/admin" className="small muted">← All cards</Link>
          <h1 className="h1">{c.fullName}</h1>
        </div>
        <a className="btn btn-dark" href={`/${c.slug}`} target="_blank" rel="noopener noreferrer"><Icon name="external" size={18} /> Open card</a>
      </div>
      {saved && <p className="notice notice-ok">Saved. {c.isActive ? "The card is live." : "The card is switched off."}</p>}

      <div className="edit-layout">
        <CardForm baseUrl={baseUrl()} initial={{ ...c, photo: imgSrc(c.photoId) }} />

        <aside className="stack">
          {c.isActive && (
            <div className="panel preview-wrap">
              <iframe className="phone-preview" src={`/${c.slug}?preview=${c.updatedAt.getTime()}`} title="Live preview" loading="lazy" />
            </div>
          )}
          <div className="panel share-panel">
            <h2 className="h3">Share &amp; NFC</h2>
            <div className="qr-box" dangerouslySetInnerHTML={{ __html: qr }} />
            <p className="mono small break">{url}</p>
            <div className="row-wrap">
              <CopyButton text={url} />
              <a className="btn btn-dark btn-sm" href={`/admin/cards/${c.id}/qr?format=png`}><Icon name="download" size={16} /> PNG</a>
              <a className="btn btn-dark btn-sm" href={`/admin/cards/${c.id}/qr?format=svg`}><Icon name="download" size={16} /> SVG</a>
            </div>
            <p className="field-hint">Write this exact link to the NFC tag (NFC Tools → Write → URL).</p>
          </div>
          <div className="panel">
            <h2 className="h3">Danger zone</h2>
            <p className="small muted">Deleting removes the card and photo. Tags pointing to it will show “not found”.</p>
            <form action={deleteCardAction}>
              <input type="hidden" name="id" value={c.id} />
              <ConfirmSubmit message={`Delete ${c.fullName}'s card permanently?`}><Icon name="trash" size={16} /> Delete card</ConfirmSubmit>
            </form>
          </div>
        </aside>
      </div>
    </>
  );
}

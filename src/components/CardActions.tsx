"use client";
import { useRef, useState } from "react";
import { Icon } from "./Icon";

export function CardActions({ vcardHref, url, name, qrSvg }: { vcardHref: string; url: string; name: string; qrSvg: string }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: name, text: `${name}'s contact card`, url }); return; } catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  }

  return (
    <div className="vc-actions">
      <a className="btn btn-gold btn-lg" href={vcardHref} download>
        <Icon name="save" /> Save my contact
      </a>
      <div className="vc-actions-row">
        <button type="button" className="btn btn-dark" onClick={share}>
          <Icon name={copied ? "check" : "share"} className="ic-mint" /> {copied ? "Link copied" : "Share"}
        </button>
        <button type="button" className="btn btn-dark" onClick={() => dlg.current?.showModal()}>
          <Icon name="qr" className="ic-mint" /> QR code
        </button>
      </div>

      <dialog ref={dlg} className="vc-dialog" onClick={(e) => { if (e.target === dlg.current) dlg.current?.close(); }}>
        <div className="vc-dialog-body">
          <button type="button" className="icon-btn vc-dialog-x" aria-label="Close" onClick={() => dlg.current?.close()}>
            <Icon name="close" />
          </button>
          <p className="vc-dialog-title">Scan to save {name.split(" ")[0]}</p>
          <p className="vc-dialog-sub">Point a phone camera at the code</p>
          {/* SVG generated server-side by the qrcode library from our own URL — not user HTML. */}
          <div className="vc-qr" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <p className="vc-dialog-url">{url.replace(/^https?:\/\//, "")}</p>
        </div>
      </dialog>
    </div>
  );
}

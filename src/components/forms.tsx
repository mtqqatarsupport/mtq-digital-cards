"use client";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "./Icon";

export function Field({
  label, name, error, hint, ...rest
}: { label: string; name: string; error?: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`field${error ? " has-error" : ""}`}>
      <span className="field-label">{label}</span>
      <input name={name} {...rest} aria-invalid={!!error} />
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function Submit({ children, className = "btn btn-primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? "Saving…" : children}
    </button>
  );
}

export function FormMessage({ state }: { state: { ok?: boolean; message?: string } }) {
  if (!state.message) return null;
  return <p className={`notice ${state.ok ? "notice-ok" : "notice-err"}`} role="status">{state.message}</p>;
}

/**
 * Image picker that downsizes in the browser before upload (phones produce
 * 5–12 MB photos; Vercel caps request bodies at 4.5 MB). The server still
 * re-validates and re-encodes everything.
 */
export function ImageInput({
  name, label, current, shape = "portrait", error, removeName, accept = "image/jpeg,image/png,image/webp,image/heic,image/heif",
  maxSide = 1600,
}: {
  name: string; label: string; current?: string | null; shape?: "portrait" | "logo"; error?: string;
  removeName?: string; accept?: string; maxSide?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(current ?? null);
  const [busy, setBusy] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setRemoved(false);
    if (f.type === "image/svg+xml" || f.size < 900_000) { setPreview(URL.createObjectURL(f)); return; }
    setBusy(true);
    try {
      const bmp = await createImageBitmap(f);
      const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas");
      c.width = Math.round(bmp.width * scale);
      c.height = Math.round(bmp.height * scale);
      c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
      const keepAlpha = shape === "logo";
      const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), keepAlpha ? "image/png" : "image/jpeg", 0.88));
      const out = new File([blob], keepAlpha ? "logo.png" : "photo.jpg", { type: blob.type });
      const dt = new DataTransfer();
      dt.items.add(out);
      ref.current!.files = dt.files;
      setPreview(URL.createObjectURL(out));
    } catch {
      setPreview(URL.createObjectURL(f)); // browser can't decode (e.g. HEIC on desktop) — let the server try
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`image-input ${shape}${error ? " has-error" : ""}`}>
      <span className="field-label">{label}</span>
      <div className="image-input-row">
        <div className="image-preview">
          {preview && !removed ? <img src={preview} alt="" /> : <span className="muted small">No image</span>}
        </div>
        <div className="image-input-ctrl">
          <label className="btn btn-dark btn-sm">
            {busy ? "Preparing…" : preview && !removed ? "Replace" : "Upload"}
            <input ref={ref} type="file" name={name} accept={accept} onChange={onChange} hidden />
          </label>
          {removeName && current && (
            <label className="check small">
              <input type="checkbox" name={removeName} checked={removed} onChange={(e) => setRemoved(e.target.checked)} /> Remove
            </label>
          )}
          <span className="field-hint">{shape === "logo" ? "PNG with transparent background works best. SVG/JPG also OK." : "Portrait photo, face centred. JPG/PNG/HEIC."}</span>
        </div>
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export function CopyButton({ text, label = "Copy link" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="btn btn-dark btn-sm" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); } catch {}
    }}>
      <Icon name={done ? "check" : "copy"} size={16} /> {done ? "Copied" : label}
    </button>
  );
}

export function ConfirmSubmit({ children, message, className = "btn btn-danger btn-sm" }: { children: React.ReactNode; message: string; className?: string }) {
  return (
    <button type="submit" className={className} onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}

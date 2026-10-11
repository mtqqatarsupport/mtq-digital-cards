import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { getCardBySlug, incrementViews } from "@/lib/store";
import { cardUrl, getSettings, imgSrc, initials, logoSrc, mapsHref, telHref } from "@/lib/site";
import { brandedQrSvg } from "@/lib/qr";
import { safeColor } from "@/lib/validation";
import { Icon, type IconName } from "@/components/Icon";
import { CardActions } from "@/components/CardActions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> };

async function loadCard(slug: string) {
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return null;
  const card = await getCardBySlug(slug);
  return card?.isActive ? card : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const card = await loadCard(slug);
  if (!card) return { title: "Card not found" };
  const s = await getSettings();
  return {
    title: `${card.fullName} · ${card.jobTitle} — ${s.companyName}`,
    description: `${card.jobTitle} at ${s.companyName}. Tap to save contact.`,
    openGraph: {
      title: `${card.fullName} — ${card.jobTitle}`,
      description: s.companyName,
      images: card.photoId ? [imgSrc(card.photoId)!] : ["/brand/logo.png"],
    },
  };
}

export default async function CardPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const card = await loadCard(slug);
  if (!card) notFound();
  const s = await getSettings();
  const url = cardUrl(card.slug);
  const qrSvg = await brandedQrSvg(url);

  if (!preview) after(() => incrementViews(card.id).catch(() => {}));

  const website = card.website || s.website;
  const office = card.phone || s.officePhone;
  type Quick = { icon: IconName; label: string; href: string; ext?: boolean };
  const quick: Quick[] = [];
  if (card.mobile) quick.push({ icon: "phone", label: "Call", href: telHref(card.mobile) });
  if (card.whatsapp) quick.push({ icon: "whatsapp", label: "WhatsApp", href: `https://wa.me/${card.whatsapp}`, ext: true });
  if (card.email) quick.push({ icon: "mail", label: "Email", href: `mailto:${card.email}` });
  if (website) quick.push({ icon: "globe", label: "Website", href: website, ext: true });
  if (s.address && quick.length < 4) quick.push({ icon: "directions", label: "Directions", href: mapsHref(s.address), ext: true });

  type Row = { icon: IconName; label: string; value: string; href?: string; ext?: boolean };
  const rows: Row[] = [];
  if (card.mobile) rows.push({ icon: "phone", label: "Mobile", value: card.mobile, href: telHref(card.mobile) });
  if (office) rows.push({ icon: "office", label: "Office", value: office, href: telHref(office) });
  if (card.email) rows.push({ icon: "mail", label: "Email", value: card.email, href: `mailto:${card.email}` });
  if (website) rows.push({ icon: "globe", label: "Website", value: website.replace(/^https?:\/\//, "").replace(/\/$/, ""), href: website, ext: true });
  if (card.linkedin) rows.push({ icon: "linkedin", label: "LinkedIn", value: "View profile", href: card.linkedin, ext: true });
  if (s.address) rows.push({ icon: "pin", label: "Office address", value: s.address, href: mapsHref(s.address), ext: true });

  const photo = imgSrc(card.photoId);
  const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

  return (
    <main className="card-shell" style={{ ["--accent" as string]: safeColor(s.accent) }}>
      <article className="vcard">
        <header className="vc-brand rise" style={{ ["--d" as string]: "0ms" }}>
          <span className="vc-logo"><img src={logoSrc(s)} alt="" /></span>
          <span className="vc-brand-txt">
            <strong>{s.companyName}</strong>
            {s.tagline && <small>{s.tagline}</small>}
          </span>
        </header>

        <figure className="vc-portrait rise" style={{ ["--d" as string]: "60ms" }}>
          {photo ? <img src={photo} alt={card.fullName} /> : <span className="vc-monogram">{initials(card.fullName)}</span>}
          {card.department && <figcaption className="vc-chip"><i aria-hidden="true" />{card.department}</figcaption>}
        </figure>

        <section className="vc-id rise" style={{ ["--d" as string]: "120ms" }}>
          <h1>
            {card.fullName}
            <span className="vc-verified" title={`Verified ${s.companyName} staff`} aria-label="Verified staff">
              <Icon name="shield" size={20} />
            </span>
          </h1>
          <p className="vc-role">{card.jobTitle}</p>
          <p className="vc-org">{s.companyName}</p>
        </section>

        <div className="rise" style={{ ["--d" as string]: "180ms" }}>
          <CardActions vcardHref={`/${card.slug}/vcard`} url={url} name={card.fullName} qrSvg={qrSvg} />
        </div>

        {quick.length > 0 && (
          <nav className="vc-quick rise" style={{ ["--d" as string]: "240ms" }} aria-label="Quick actions">
            {quick.map((q) => (
              <a key={q.label} href={q.href} {...(q.ext ? ext : {})}>
                <span className="vc-quick-ic"><Icon name={q.icon} size={21} /></span>
                <span>{q.label}</span>
              </a>
            ))}
          </nav>
        )}

        <ul className="vc-list rise" style={{ ["--d" as string]: "300ms" }}>
          {rows.map((r) => (
            <li key={r.label}>
              <a href={r.href} {...(r.ext ? ext : {})}>
                <span className="vc-ic"><Icon name={r.icon} size={19} /></span>
                <span className="vc-txt"><small>{r.label}</small><span>{r.value}</span></span>
                <Icon name="chevron" size={18} className="vc-chev" />
              </a>
            </li>
          ))}
        </ul>

        <footer className="vc-foot">
          <span className="vc-logo vc-logo-sm"><img src={logoSrc(s)} alt="" /></span>
          <span>© {new Date().getFullYear()} {s.companyName}</span>
        </footer>
      </article>
    </main>
  );
}

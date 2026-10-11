import "server-only";
import type { Card, Settings } from "./store";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

// RFC 6350 line folding at 75 octets.
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (Buffer.byteLength(rest) > 75) {
    let cut = 75;
    while (Buffer.byteLength(rest.slice(0, cut)) > 75) cut--;
    out.push(rest.slice(0, cut));
    rest = " " + rest.slice(cut);
  }
  out.push(rest);
  return out.join("\r\n");
}

export function buildVCard(card: Card, s: Settings, url: string, photoJpegB64?: string) {
  const parts = card.fullName.trim().split(/\s+/);
  const last = parts.length > 1 ? parts.pop()! : "";
  const first = parts.join(" ");
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(last)};${esc(first)};;;`,
    `FN:${esc(card.fullName)}`,
    `ORG:${esc(s.companyName)}${card.department ? ";" + esc(card.department) : ""}`,
    `TITLE:${esc(card.jobTitle)}`,
    card.mobile && `TEL;TYPE=CELL,VOICE:${card.mobile}`,
    card.phone && `TEL;TYPE=WORK,VOICE:${card.phone}`,
    !card.phone && s.officePhone && `TEL;TYPE=WORK,VOICE:${s.officePhone}`,
    card.email && `EMAIL;TYPE=INTERNET,WORK:${esc(card.email)}`,
    (card.website || s.website) && `URL;TYPE=WORK:${esc(card.website || s.website)}`,
    card.linkedin && `URL;TYPE=LinkedIn:${esc(card.linkedin)}`,
    `URL;TYPE=Card:${esc(url)}`,
    s.address && `ADR;TYPE=WORK:;;${esc(s.address)};;;;`,
    photoJpegB64 && `PHOTO;ENCODING=b;TYPE=JPEG:${photoJpegB64}`,
    `REV:${new Date().toISOString()}`,
    "END:VCARD",
  ].filter(Boolean) as string[];
  return lines.map(fold).join("\r\n") + "\r\n";
}

import "server-only";
import QRCode from "qrcode";

/**
 * QR code as SVG with the company logo in the centre.
 * Uses the highest error-correction level (H, ~30% recoverable) and keeps the
 * logo plate to ~22% of the width, so the code still scans reliably.
 */
export async function brandedQrSvg(url: string, logoHref = "/brand/logo.png") {
  const svg = await QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "H", color: { dark: "#06120C", light: "#FFFFFF" } });
  const size = Number(/viewBox="0 0 (\d+) /.exec(svg)?.[1] ?? 0);
  if (!size) return svg;
  const plate = size * 0.24;
  const o = (size - plate) / 2;
  const pad = plate * 0.14;
  const overlay =
    `<rect x="${o}" y="${o}" width="${plate}" height="${plate}" rx="${plate * 0.22}" fill="#FFFFFF"/>` +
    `<image href="${logoHref}" x="${o + pad}" y="${o + pad}" width="${plate - 2 * pad}" height="${plate - 2 * pad}" preserveAspectRatio="xMidYMid meet"/>`;
  return svg.replace("</svg>", `${overlay}</svg>`);
}

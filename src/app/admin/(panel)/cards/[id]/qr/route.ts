import path from "node:path";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { getAdmin } from "@/lib/auth";
import { brandedQrSvg } from "@/lib/qr";
import { cardUrl, isDocId } from "@/lib/site";
import { getCard, getImage, getSettings } from "@/lib/store";

async function logoPng() {
  const s = await getSettings();
  const img = s.logoId ? await getImage(s.logoId) : null;
  if (img) return sharp(img.data).png().toBuffer();
  return readFile(path.join(process.cwd(), "public/brand/logo.png"));
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const c = isDocId(id) ? await getCard(id) : null;
  if (!c) return new Response("Not found", { status: 404 });

  const format = new URL(req.url).searchParams.get("format") === "svg" ? "svg" : "png";
  // Self-contained file: logo embedded as data URI so it prints anywhere.
  const logo = `data:image/png;base64,${(await logoPng()).toString("base64")}`;
  const svg = await brandedQrSvg(cardUrl(c.slug), logo);
  const headers = { "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="qr-${c.slug}.${format}"`, "X-Content-Type-Options": "nosniff" };
  if (format === "svg") return new Response(svg, { headers: { ...headers, "Content-Type": "image/svg+xml" } });
  const png = await sharp(Buffer.from(svg), { density: 600 }).resize(1600, 1600).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { ...headers, "Content-Type": "image/png" } });
}

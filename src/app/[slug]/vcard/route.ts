import sharp from "sharp";
import { cardUrl } from "@/lib/site";
import { getCardBySlug, getImage, getSettings } from "@/lib/store";
import { buildVCard } from "@/lib/vcard";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return new Response("Not found", { status: 404 });
  const card = await getCardBySlug(slug);
  if (!card?.isActive) return new Response("Not found", { status: 404 });
  const s = await getSettings();

  let photo: string | undefined;
  if (card.photoId) {
    const img = await getImage(card.photoId);
    if (img) photo = (await sharp(img.data).resize(320, 320, { fit: "cover", position: "top" }).jpeg({ quality: 80 }).toBuffer()).toString("base64");
  }

  const body = buildVCard(card, s, cardUrl(card.slug), photo);
  const file = card.fullName.replace(/[^A-Za-z0-9 _-]/g, "").trim().replace(/\s+/g, "_") || "contact";
  return new Response(body, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file}.vcf"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

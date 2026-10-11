import "server-only";
import sharp from "sharp";
import { deleteImage as removeImage, putImage } from "./store";

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_STORED = 900 * 1024; // Firestore documents are capped at 1 MiB
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/avif"]);
const LOGO_TYPES = new Set([...PHOTO_TYPES, "image/svg+xml"]);

sharp.cache(false);
sharp.concurrency(1);

export class ImageError extends Error {}

/**
 * Decode → re-encode every upload. Whatever arrived (EXIF, GPS, scripts in an
 * SVG, polyglot payloads) is discarded; only fresh pixels are stored.
 */
async function sanitize(file: File, kind: "photo" | "logo") {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_BYTES) throw new ImageError("Image is larger than 4 MB");
  const allowed = kind === "logo" ? LOGO_TYPES : PHOTO_TYPES;
  if (!allowed.has(file.type)) throw new ImageError("Unsupported image type");

  const input = Buffer.from(await file.arrayBuffer());
  try {
    let img = sharp(input, { limitInputPixels: 40_000_000, failOn: "error", density: kind === "logo" ? 300 : undefined }).rotate();
    const meta = await img.metadata();
    if (!meta.width || !meta.height) throw new ImageError("Could not read image");
    if (kind === "logo") {
      // Trim empty white/transparent margins so the logo sits tight on its tile.
      try { img = sharp(await img.clone().trim({ threshold: 12 }).png().toBuffer()); } catch { /* uniform image */ }
    }
    for (const quality of [82, 70, 58]) {
      const pipeline =
        kind === "photo"
          ? img.clone().resize({ width: 900, height: 1012, fit: "cover", position: "attention", withoutEnlargement: true }).webp({ quality })
          : img.clone().resize({ width: 800, height: 400, fit: "inside", withoutEnlargement: true }).webp({ quality: quality + 8, alphaQuality: 100 });
      const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
      if (data.length <= MAX_STORED) return { data, width: info.width, height: info.height, mime: "image/webp" };
    }
    throw new ImageError("Image is too detailed to store — try a smaller photo");
  } catch (e) {
    if (e instanceof ImageError) throw e;
    throw new ImageError("That file is not a valid image");
  }
}

export async function storeImage(file: File, kind: "photo" | "logo") {
  const clean = await sanitize(file, kind);
  return clean ? putImage(clean) : null;
}

export const deleteImage = removeImage;

// Photo picker for the demo quote forms. Photos never leave the browser and are never stored: each one is checked
// (type by name and by what the browser reports, 10 MB, five at most), shrunk to a small thumbnail on a canvas and
// shown as a data: image (the site's security policy allows data: images, not blob: ones). SVG and every other type
// is refused, so nothing that can carry a script is ever drawn.
export const PHOTO_LIMIT = 5;
export const PHOTO_BYTES = 10 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const NAMES = /\.(jpe?g|png|webp|heic|heif)$/i;

export type PhotoLike = { name: string; type: string; size: number };

/** Why this file can't be added, or null when it can. */
export function checkPhoto(f: PhotoLike, count = 0): string | null {
  if (count >= PHOTO_LIMIT) return `Five photos at most, so ${f.name} was left out.`;
  const typeOk = f.type ? TYPES.has(f.type.toLowerCase()) : false;
  // Windows often reports no type for HEIC, so a known name with an empty type is accepted
  if (!NAMES.test(f.name) || (f.type && !typeOk)) return `${f.name} isn't a JPEG, PNG, WebP or HEIC photo.`;
  if (f.size > PHOTO_BYTES) return `${f.name} is over 10 MB.`;
  if (f.size === 0) return `${f.name} is empty.`;
  return null;
}

/** A small JPEG data: URL of the photo, or null when this browser can't read the format (HEIC outside Safari). */
export async function thumbnail(file: File, size = 240): Promise<string | null> {
  let bmp: ImageBitmap | undefined;
  try {
    bmp = await createImageBitmap(file);
    const k = Math.min(1, size / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(bmp.width * k));
    c.height = Math.max(1, Math.round(bmp.height * k));
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.82);
  } catch {
    return null;
  } finally {
    bmp?.close();
  }
}

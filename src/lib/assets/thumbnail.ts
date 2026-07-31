import sharp from "sharp";

export const THUMBNAIL_WIDTH = 480;
export const THUMBNAIL_QUALITY = 80;
export const THUMBNAIL_FORMAT = "webp" as const;

export const THUMBNAIL_MIME_PREFIXES = ["image/"] as const;

export function isThumbnailSupported(mimeType: string): boolean {
  return THUMBNAIL_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

export async function generateThumbnail(
  sourceBuffer: Buffer,
  options: { width?: number; quality?: number } = {},
): Promise<Buffer> {
  const width = options.width ?? THUMBNAIL_WIDTH;
  const quality = options.quality ?? THUMBNAIL_QUALITY;
  return sharp(sourceBuffer, { failOn: "none" })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
}

export async function readImageMetadata(
  sourceBuffer: Buffer,
): Promise<{ width?: number; height?: number }> {
  try {
    const meta = await sharp(sourceBuffer).metadata();
    return { width: meta.width, height: meta.height };
  } catch {
    return {};
  }
}

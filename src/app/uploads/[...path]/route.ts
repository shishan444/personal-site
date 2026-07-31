import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import type { NextRequest } from "next/server";

const UPLOAD_ROOT = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "uploads");

const MIME_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".zip": "application/zip",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const absolutePath = path.resolve(UPLOAD_ROOT, ...segments);
  if (absolutePath !== UPLOAD_ROOT && !absolutePath.startsWith(`${UPLOAD_ROOT}${path.sep}`)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const fileStat = await stat(absolutePath);
    if (!fileStat.isFile()) return new Response("Not Found", { status: 404 });

    const ext = path.extname(absolutePath).toLowerCase();
    const stream = Readable.toWeb(createReadStream(absolutePath)) as ReadableStream;
    return new Response(stream, {
      headers: {
        "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
        "Content-Length": String(fileStat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}

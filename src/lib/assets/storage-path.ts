import { randomUUID } from "node:crypto";
import path from "node:path";

export interface StorageLayout {
  year: string;
  month: string;
  relativeDir: string;
  absoluteDir: string;
  filename: string;
  relativePath: string;
  absolutePath: string;
  thumbnailRelativePath: string;
  thumbnailAbsolutePath: string;
  publicUrl: string;
}

export function buildStorageLayout(options: {
  originalFilename: string;
  uploadRoot: string;
  publicBaseUrl: string;
  date?: Date;
  filenameStrategy?: "uuid-keep-ext" | "uuid-replace-ext";
}): StorageLayout {
  const date = options.date ?? new Date();
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const relativeDir = path.posix.join(year, month);
  const absoluteDir = path.resolve(options.uploadRoot, relativeDir);

  const ext = path.extname(options.originalFilename).toLowerCase() || "";
  const uuid = randomUUID();
  const filename = options.filenameStrategy === "uuid-replace-ext" ? uuid : `${uuid}${ext}`;

  const relativePath = path.posix.join(relativeDir, filename);
  const absolutePath = path.resolve(absoluteDir, filename);
  const thumbnailRelativePath = path.posix.join(relativeDir, "_thumbnails", `${uuid}.webp`);
  const thumbnailAbsolutePath = path.resolve(absoluteDir, "_thumbnails", `${uuid}.webp`);
  const publicUrl = `${options.publicBaseUrl}/${relativePath}`.replace(/\\/g, "/");

  return {
    year,
    month,
    relativeDir,
    absoluteDir,
    filename,
    relativePath,
    absolutePath,
    thumbnailRelativePath,
    thumbnailAbsolutePath,
    publicUrl,
  };
}

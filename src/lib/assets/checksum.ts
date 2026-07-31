import { createHash } from "node:crypto";

export function computeChecksum(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function shortChecksum(buffer: Buffer): string {
  return computeChecksum(buffer).slice(0, 12);
}

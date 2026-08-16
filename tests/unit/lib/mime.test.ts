import { describe, expect, it } from "vitest";
import { isAllowedMimeType, MIME_ALLOWLIST } from "@/lib/assets/mime";

describe("L1 · 上传 MIME 白名单", () => {
  it("F1 · 允许图片类型", () => {
    expect(isAllowedMimeType("image/jpeg")).toBe(true);
    expect(isAllowedMimeType("image/png")).toBe(true);
    expect(isAllowedMimeType("image/webp")).toBe(true);
    expect(isAllowedMimeType("image/gif")).toBe(true);
    expect(isAllowedMimeType("image/svg+xml")).toBe(true);
  });

  it("F2 · 允许文档与视频类型", () => {
    expect(isAllowedMimeType("application/pdf")).toBe(true);
    expect(isAllowedMimeType("text/plain")).toBe(true);
    expect(isAllowedMimeType("text/markdown")).toBe(true);
    expect(isAllowedMimeType("video/mp4")).toBe(true);
    expect(isAllowedMimeType("video/webm")).toBe(true);
    expect(isAllowedMimeType("application/zip")).toBe(true);
  });

  it("F3 · 拒绝可执行与未知类型", () => {
    expect(isAllowedMimeType("application/x-msdownload")).toBe(false);
    expect(isAllowedMimeType("application/x-sh")).toBe(false);
    expect(isAllowedMimeType("application/octet-stream")).toBe(false);
    expect(isAllowedMimeType("")).toBe(false);
    expect(isAllowedMimeType("image/heic")).toBe(false);
  });

  it("F4 · 白名单非空且全量暴露（供文档对齐）", () => {
    expect(MIME_ALLOWLIST.length).toBeGreaterThan(5);
    expect(MIME_ALLOWLIST.every((m) => m.includes("/"))).toBe(true);
  });
});

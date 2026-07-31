import { describe, expect, it } from "vitest";
import { buildStorageLayout } from "@/lib/assets/storage-path";

describe("L1 · storage-path", () => {
  it("F1 · 路径按年月分目录", () => {
    const layout = buildStorageLayout({
      originalFilename: "cover.png",
      uploadRoot: "/uploads",
      publicBaseUrl: "/uploads",
      date: new Date("2026-07-15"),
    });
    expect(layout.year).toBe("2026");
    expect(layout.month).toBe("07");
    expect(layout.relativeDir).toBe("2026/07");
    expect(layout.relativePath).toMatch(/^2026\/07\/[a-f0-9-]+\.png$/);
  });

  it("F2 · 缩略图路径含 _thumbnails/ + .webp", () => {
    const layout = buildStorageLayout({
      originalFilename: "x.jpg",
      uploadRoot: "/uploads",
      publicBaseUrl: "/uploads",
    });
    expect(layout.thumbnailRelativePath).toMatch(/^\d{4}\/\d{2}\/_thumbnails\/[a-f0-9-]+\.webp$/);
  });

  it("F3 · publicUrl 拼接 publicBaseUrl", () => {
    const layout = buildStorageLayout({
      originalFilename: "x.png",
      uploadRoot: "/uploads",
      publicBaseUrl: "/uploads",
    });
    expect(layout.publicUrl.startsWith("/uploads/")).toBe(true);
  });

  it("F4 · 月份补零", () => {
    const layout = buildStorageLayout({
      originalFilename: "x.png",
      uploadRoot: "/u",
      publicBaseUrl: "/u",
      date: new Date("2026-01-05"),
    });
    expect(layout.month).toBe("01");
  });

  it("F5 · 无扩展名文件名处理", () => {
    const layout = buildStorageLayout({
      originalFilename: "README",
      uploadRoot: "/u",
      publicBaseUrl: "/u",
    });
    expect(layout.filename).toMatch(/^[a-f0-9-]{36}$/);
    expect(layout.relativePath).toMatch(/^\d{4}\/\d{2}\/[a-f0-9-]+$/);
  });

  it("F6 · uuid-replace-ext 策略无扩展名", () => {
    const layout = buildStorageLayout({
      originalFilename: "photo.heic",
      uploadRoot: "/u",
      publicBaseUrl: "/u",
      filenameStrategy: "uuid-replace-ext",
    });
    expect(layout.filename).toMatch(/^[a-f0-9-]{36}$/);
    expect(layout.filename.endsWith(".heic")).toBe(false);
  });
});

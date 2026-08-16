"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { toast } from "@/components/ui/toaster";

/** 资产库拖拽/多文件上传入口（审计 #19：资产页此前只有网格+删除，上传只能绕道截图组件）。 */
export function AssetUploader() {
  const t = useTranslations("admin.assets_page");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    let ok = 0;
    let failed = 0;
    for (const file of list) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) {
          ok += 1;
        } else {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          toast.error(
            `${file.name}`,
            body.error === "MIME_NOT_ALLOWED"
              ? t("err_mime")
              : body.error === "FILE_TOO_LARGE"
                ? t("err_size")
                : t("err_generic"),
          );
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    }
    setUploading(false);
    if (ok > 0) {
      toast.success(t("toast_uploaded", { count: ok }));
      startTransition(() => router.refresh());
    }
    if (failed === 0 && ok > 0) {
      // 全部成功的场景已提示
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        uploadFiles(e.dataTransfer.files);
      }}
      className={`border border-dashed p-6 text-center transition-colors ${
        dragging
          ? "border-[var(--color-accent)] bg-[var(--color-glass)]"
          : "border-[var(--color-line)]"
      } ${pending || uploading ? "opacity-60" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={uploading || pending}
        onClick={() => inputRef.current?.click()}
        className="text-xs uppercase tracking-widest px-4 py-2 border border-[var(--color-line)] glass-chip text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-40"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {uploading ? t("uploading") : t("upload_button")}
      </button>
      <p
        className="text-[10px] text-[var(--color-ink-soft)] mt-3"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {t("upload_hint")}
      </p>
    </div>
  );
}

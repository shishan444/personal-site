"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  type AgentScreenshotLink,
  linkAgentScreenshot,
  reorderAgentScreenshots,
  unlinkAgentScreenshot,
} from "@/lib/actions/agent-screenshots";

export interface AgentScreenshotsProps {
  agentId: string;
  initial: AgentScreenshotLink[];
}

export function AgentScreenshots({ agentId, initial }: AgentScreenshotsProps) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  // dragstart/drop 可能在同一同步事件序列内触发，逻辑判断用 ref，state 仅用于样式
  const dragIdRef = useRef<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  // router.refresh() 后服务端数据变化时同步本地行状态（useState(initial) 不会自动跟进）
  useEffect(() => {
    setRows(initial);
  }, [initial]);

  async function handleUpload(file: File) {
    setUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        setMessage(`上传失败（${res.status}）`);
        return;
      }
      const json = (await res.json()) as { asset: { id: string } };
      await linkAgentScreenshot(agentId, json.asset.id, file.name);
      router.refresh();
      setMessage("已上传并绑定");
    } catch {
      setMessage("上传失败，请重试");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleDrop(targetId: string) {
    const sourceId = dragIdRef.current;
    if (!sourceId || sourceId === targetId) return;
    const from = rows.findIndex((r) => r.linkId === sourceId);
    const to = rows.findIndex((r) => r.linkId === targetId);
    if (from < 0 || to < 0) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setRows(next);
    startTransition(async () => {
      try {
        await reorderAgentScreenshots(
          agentId,
          next.map((r) => r.linkId),
        );
        router.refresh();
      } catch {
        setMessage("排序保存失败");
        setRows(initial);
      }
    });
  }

  function handleRemove(linkId: string) {
    if (!window.confirm("移除该截图与 Agent 的关联？（文件本身保留在资产库）")) return;
    startTransition(async () => {
      try {
        await unlinkAgentScreenshot(linkId);
        router.refresh();
      } catch {
        setMessage("移除失败");
      }
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2
          className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          详情页截图 · {rows.length}
        </h2>
        <label
          className={`cursor-pointer border border-[var(--color-line)] px-3 py-1.5 text-[10px] uppercase tracking-widest hover:border-[var(--color-accent)] ${uploading ? "opacity-40 pointer-events-none" : ""}`}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {uploading ? "上传中…" : "＋ 上传截图"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleUpload(f);
            }}
          />
        </label>
      </div>

      {rows.length === 0 ? (
        <div
          className="border border-dashed border-[var(--color-line)] p-6 text-center text-[var(--color-ink-soft)] text-xs"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          — 暂无截图，上传后将在前台详情页展示 —
        </div>
      ) : (
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {rows.map((s) => (
            <li
              key={s.linkId}
              draggable
              onDragStart={() => {
                dragIdRef.current = s.linkId;
                setDragId(s.linkId);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setOverId(s.linkId);
              }}
              onDragLeave={() => setOverId((cur) => (cur === s.linkId ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                setOverId(null);
                handleDrop(s.linkId);
              }}
              onDragEnd={() => {
                dragIdRef.current = null;
                setDragId(null);
                setOverId(null);
              }}
              className={`border border-[var(--color-line)] bg-[var(--color-bg-2)] ${
                overId === s.linkId && dragId !== s.linkId
                  ? "outline outline-1 outline-[var(--color-accent)]"
                  : ""
              } ${dragId === s.linkId ? "opacity-40" : ""}`}
            >
              <div className="relative aspect-video cursor-grab active:cursor-grabbing">
                <Image
                  src={s.url}
                  alt={s.caption ?? "screenshot"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="flex items-center justify-between px-2 py-1.5">
                <span
                  className="text-[10px] text-[var(--color-ink-soft)] truncate"
                  style={{ fontFamily: "var(--font-mono)" }}
                  title={s.caption ?? undefined}
                >
                  ⠿ {s.caption ?? s.assetId.slice(0, 8)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(s.linkId)}
                  disabled={pending}
                  className="text-[10px] text-[var(--color-danger)] hover:underline disabled:opacity-40"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {message && (
        <p
          className="text-xs text-[var(--color-ink-soft)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {message}
        </p>
      )}
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { restoreEssayRevision } from "@/lib/actions/essays";
import type { EssayRevisionRow } from "@/lib/queries/admin-list";

const ACTION_LABELS: Record<EssayRevisionRow["action"], string> = {
  created: "创建",
  edited: "编辑",
  published: "发布",
  archived: "归档",
  restored: "恢复",
};

export interface EssayRevisionsProps {
  essayId: string;
  revisions: EssayRevisionRow[];
}

export function EssayRevisions({ essayId, revisions }: EssayRevisionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleRestore(revisionId: string) {
    if (!window.confirm("恢复到此版本？当前内容将先存为新版本，可随时再恢复。")) return;
    setPendingId(revisionId);
    setError(null);
    startTransition(async () => {
      try {
        await restoreEssayRevision(essayId, revisionId);
        router.refresh();
      } catch {
        setError("恢复失败，请重试");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <section className="space-y-3">
      <h2
        className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        历史记录 · {revisions.length}
      </h2>
      {revisions.length === 0 ? (
        <div
          className="border border-dashed border-[var(--color-line)] p-6 text-center text-[var(--color-ink-soft)] text-xs"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          — 暂无历史版本 —
        </div>
      ) : (
        <ul className="border border-[var(--color-line)] divide-y divide-[var(--color-line)]">
          {revisions.map((r) => (
            <li key={r.id} className="flex items-center gap-4 px-4 py-2.5 text-sm">
              <span
                className="text-[10px] text-[var(--color-ink-soft)] w-36 shrink-0"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {r.createdAt.toISOString().replace("T", " ").slice(0, 19)}
              </span>
              <span
                className="text-[10px] uppercase tracking-widest text-[var(--color-accent-2)] w-14 shrink-0"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {ACTION_LABELS[r.action]}
              </span>
              <span className="flex-1 truncate text-[var(--color-ink)]">{r.title}</span>
              <span
                className="text-[10px] text-[var(--color-ink-mute)] shrink-0"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {r.words} 字
              </span>
              <button
                type="button"
                onClick={() => handleRestore(r.id)}
                disabled={pendingId === r.id}
                className="shrink-0 text-[10px] uppercase tracking-widest text-[var(--color-accent)] hover:underline disabled:opacity-40"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {pendingId === r.id ? "恢复中…" : "↩ 恢复"}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p
          className="text-xs text-[var(--color-danger)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {error}
        </p>
      )}
    </section>
  );
}

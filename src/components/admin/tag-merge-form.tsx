"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { mergeTopicTag } from "@/lib/actions/tags";

export interface TagMergeFormProps {
  tags: string[];
}

export function TagMergeForm({ tags }: TagMergeFormProps) {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to.trim() || from === to.trim()) return;
    startTransition(async () => {
      try {
        const { affected } = await mergeTopicTag(from, to);
        setMessage(`已合并 ${from} → ${to.trim()} · 影响 ${affected} 篇文章`);
        setFrom("");
        setTo("");
        router.refresh();
      } catch {
        setMessage("合并失败，请重试");
      }
    });
  }

  const selectClass =
    "border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-ink)]";

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-[var(--color-line)] p-4 flex flex-wrap items-center gap-3"
    >
      <span
        className="text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        合并 / 重命名
      </span>
      <select value={from} onChange={(e) => setFrom(e.target.value)} className={selectClass}>
        <option value="">源标签…</option>
        {tags.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <span className="text-[var(--color-ink-mute)]">→</span>
      <input
        value={to}
        onChange={(e) => setTo(e.target.value)}
        list="tag-merge-targets"
        placeholder="目标标签（可新建）"
        className={selectClass}
      />
      <datalist id="tag-merge-targets">
        {tags.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <button
        type="submit"
        disabled={pending || !from || !to.trim() || from === to.trim()}
        className="bg-[var(--color-accent)] text-[var(--color-bg)] px-4 py-2 text-xs uppercase tracking-widest disabled:opacity-40"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {pending ? "合并中…" : "执行合并"}
      </button>
      {message && (
        <span
          className="text-xs text-[var(--color-ink-soft)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {message}
        </span>
      )}
    </form>
  );
}

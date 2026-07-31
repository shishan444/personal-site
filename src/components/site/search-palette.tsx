"use client";

import Fuse from "fuse.js";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchEntry } from "@/lib/queries/detail";

export interface SearchPaletteProps {
  index: SearchEntry[];
}

export function SearchPalette({ index }: SearchPaletteProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const router = useRouter();
  const _pathname = usePathname();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const fuse = useMemo(
    () =>
      new Fuse(index, {
        keys: ["title", "desc", "tag"],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [index],
  );

  const results = useMemo(() => {
    if (!query.trim()) return index.slice(0, 8);
    return fuse
      .search(query)
      .slice(0, 12)
      .map((r) => r.item);
  }, [query, fuse, index]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = results[selectedIdx];
      if (selected) {
        router.push(selected.href);
        setOpen(false);
      }
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-30 px-3 py-1 border border-[var(--color-line)] text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        style={{ fontFamily: "var(--font-mono)" }}
        aria-label="Open search"
      >
        ⌕ {t("common.button.search")} · ⌘K
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] bg-black/75 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-[var(--color-bg-2)] border border-[var(--color-line)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-line)]">
          <span
            className="text-[var(--color-accent)] text-lg"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            ⌕
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("admin.topbar_search_placeholder")}
            className="flex-1 bg-transparent outline-none text-base text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          >
            ESC
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--color-ink-soft)]">
              {t("common.label.empty")}
            </div>
          ) : (
            results.map((entry, idx) => (
              <button
                key={`${entry.type}-${entry.id}`}
                type="button"
                onMouseEnter={() => setSelectedIdx(idx)}
                onClick={() => {
                  router.push(entry.href);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-left border-l-2 transition-colors ${
                  idx === selectedIdx
                    ? "border-l-[var(--color-accent)] bg-[var(--color-bg-3)]"
                    : "border-l-transparent"
                }`}
              >
                <span
                  className="text-[9px] uppercase tracking-widest text-[var(--color-ink-soft)] w-16"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {entry.type}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm text-[var(--color-ink)] truncate"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {entry.title}
                  </div>
                  <div
                    className="text-[10px] text-[var(--color-ink-soft)] truncate"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {entry.desc}
                  </div>
                </div>
                <span
                  className="text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] border border-[var(--color-line)] px-1.5 py-0.5"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {entry.tag}
                </span>
              </button>
            ))
          )}
        </div>

        <div
          className="flex items-center justify-between px-5 py-2 border-t border-[var(--color-line)] text-[9px] uppercase tracking-widest text-[var(--color-ink-soft)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <div className="flex gap-4">
            <span>↑↓ 选择</span>
            <span>↵ 跳转</span>
            <span>ESC 关闭</span>
          </div>
          <span>{results.length} RESULTS</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { StatusBadge } from "@/components/shared";
import { reorderAgents } from "@/lib/actions/agents";
import type { AdminAgentRow } from "@/lib/queries/admin-list";

export interface SortableAgentsListProps {
  agents: AdminAgentRow[];
  locale: string;
  statusLabels: Record<string, string>;
  emptyText: string;
}

export function SortableAgentsList({
  agents: initialAgents,
  locale,
  statusLabels,
  emptyText,
}: SortableAgentsListProps) {
  const router = useRouter();
  const [rows, setRows] = useState(initialAgents);
  const [dragId, setDragId] = useState<string | null>(null);
  // dragstart/drop 可能在同一同步事件序列内触发（如程序化分发），
  // state 尚未提交时 drop 闭包读到 null，故逻辑判断用 ref，state 仅用于样式
  const dragIdRef = useRef<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // router.refresh() 后服务端数据变化时同步本地行状态（useState(initial) 不会自动跟进）
  useEffect(() => {
    setRows(initialAgents);
  }, [initialAgents]);

  function handleDrop(targetId: string) {
    const sourceId = dragIdRef.current;
    if (!sourceId || sourceId === targetId) return;
    const from = rows.findIndex((r) => r.id === sourceId);
    const to = rows.findIndex((r) => r.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setRows(next);
    setError(null);
    startTransition(async () => {
      try {
        await reorderAgents(next.map((r) => r.id));
        router.refresh();
      } catch {
        setError("排序保存失败，请刷新重试");
        setRows(initialAgents);
      }
    });
  }

  if (rows.length === 0) {
    return (
      <div
        className="border border-dashed border-[var(--color-line)] p-12 text-center text-[var(--color-ink-soft)] text-sm"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        — {emptyText} —
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="border border-[var(--color-line)] overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] bg-[var(--color-bg-2)]">
              {["", "#", "SN", "Name", "Status", "Specs"].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)] font-normal"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => (
              <tr
                key={a.id}
                draggable
                onDragStart={() => {
                  dragIdRef.current = a.id;
                  setDragId(a.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverId(a.id);
                }}
                onDragLeave={() => setOverId((cur) => (cur === a.id ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault();
                  setOverId(null);
                  handleDrop(a.id);
                }}
                onDragEnd={() => {
                  dragIdRef.current = null;
                  setDragId(null);
                  setOverId(null);
                }}
                className={`border-b border-[var(--color-line)] last:border-b-0 transition-colors ${
                  overId === a.id && dragId !== a.id
                    ? "bg-[var(--color-bg-2)] outline outline-1 outline-[var(--color-accent)]"
                    : ""
                } ${dragId === a.id ? "opacity-40" : ""}`}
              >
                <td
                  className="px-3 py-3 cursor-grab active:cursor-grabbing text-[var(--color-ink-mute)] select-none"
                  title="拖拽排序"
                >
                  ⠿
                </td>
                <td
                  className="px-4 py-3 text-[10px] text-[var(--color-ink-soft)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </td>
                <td
                  className="px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {a.sn}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/${locale}/admin/agents/${a.id}`}
                    className="hover:text-[var(--color-accent)]"
                  >
                    {a.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    variant={
                      a.status === "active"
                        ? "active"
                        : a.status === "beta"
                          ? "warn"
                          : a.status === "coming"
                            ? "neutral"
                            : "archived"
                    }
                    dot
                  >
                    {statusLabels[a.status] ?? a.status}
                  </StatusBadge>
                </td>
                <td
                  className="px-4 py-3 text-[10px] text-[var(--color-ink-mute)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {a.specsCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        className="flex items-center gap-4 text-[10px] uppercase tracking-widest"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <span className="text-[var(--color-ink-soft)]">⠿ 拖拽行以调整前台推进顺序</span>
        {pending && <span className="text-[var(--color-accent)]">保存中…</span>}
        {error && <span className="text-[var(--color-danger)]">{error}</span>}
      </div>
    </div>
  );
}

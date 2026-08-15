"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "@/components/ui/toaster";

export interface TimelineChangeRow {
  id: string;
  type: "add" | "mod" | "del";
  text: string;
}

export interface TimelineEditorInitial {
  version: string;
  name: string;
  desc: string;
  type: "genesis" | "first" | "normal" | "now" | "future";
  date: string;
  changes: TimelineChangeRow[];
  filesChanged: string;
  linesAdd: string;
  linesDel: string;
  isNow: boolean;
}

function newChangeId() {
  return Math.random().toString(36).slice(2, 10);
}

/** Timeline 节点编辑器（审计 #17：此前列表/仪表盘入口全部指向不存在的编辑页 404）。 */
export function TimelineEditor({
  initial,
  onSubmit,
  isNew,
  cancelHref,
}: {
  initial: TimelineEditorInitial;
  onSubmit: (input: {
    version: string;
    name: string;
    desc: string;
    type: TimelineEditorInitial["type"];
    date: string;
    changes: TimelineChangeRow[];
    filesChanged: number | null;
    linesAdd: number | null;
    linesDel: number | null;
    isNow: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  isNew: boolean;
  cancelHref: string;
}) {
  const t = useTranslations("admin.timeline_node");
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [pending, setPending] = useState(false);

  const TYPE_OPTIONS: Array<{ value: TimelineEditorInitial["type"]; label: string }> = [
    { value: "genesis", label: "GENESIS" },
    { value: "first", label: "FIRST" },
    { value: "normal", label: "NORMAL" },
    { value: "now", label: "NOW" },
    { value: "future", label: "FUTURE" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const result = await onSubmit({
      ...form,
      filesChanged: form.filesChanged ? Number.parseInt(form.filesChanged, 10) : null,
      linesAdd: form.linesAdd ? Number.parseInt(form.linesAdd, 10) : null,
      linesDel: form.linesDel ? Number.parseInt(form.linesDel, 10) : null,
    });
    setPending(false);
    if (result.ok) {
      toast.success(isNew ? t("toast_created") : t("toast_saved"), form.version);
      router.push(cancelHref);
      router.refresh();
    } else {
      toast.error(result.error ?? t("toast_failed"));
    }
  }

  const labelCls =
    "text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)] mb-1.5 block";
  const inputCls =
    "w-full bg-[var(--color-glass)] border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]";

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <label>
          <span className={labelCls} style={{ fontFamily: "var(--font-mono)" }}>
            {t("field.version")}
          </span>
          <input
            required
            value={form.version}
            onChange={(e) => setForm({ ...form, version: e.target.value })}
            className={inputCls}
            placeholder="v0.6"
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </label>
        <label>
          <span className={labelCls} style={{ fontFamily: "var(--font-mono)" }}>
            {t("field.date")}
          </span>
          <input
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={inputCls}
            placeholder="2026.08"
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label>
          <span className={labelCls} style={{ fontFamily: "var(--font-mono)" }}>
            {t("field.name")}
          </span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
          />
        </label>
        <label>
          <span className={labelCls} style={{ fontFamily: "var(--font-mono)" }}>
            {t("field.type")}
          </span>
          <select
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as TimelineEditorInitial["type"] })
            }
            className={inputCls}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className={labelCls} style={{ fontFamily: "var(--font-mono)" }}>
          {t("field.desc")}
        </span>
        <textarea
          required
          rows={2}
          value={form.desc}
          onChange={(e) => setForm({ ...form, desc: e.target.value })}
          className={inputCls}
        />
      </label>

      <div>
        <span className={labelCls} style={{ fontFamily: "var(--font-mono)" }}>
          {t("field.changes")}
        </span>
        <div className="space-y-2">
          {form.changes.map((change, idx) => (
            <div key={change.id} className="flex items-center gap-2">
              <select
                value={change.type}
                onChange={(e) => {
                  const changes = [...form.changes];
                  changes[idx] = { ...change, type: e.target.value as TimelineChangeRow["type"] };
                  setForm({ ...form, changes });
                }}
                className={`${inputCls} w-28 shrink-0`}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <option value="add">+ ADD</option>
                <option value="mod">~ MOD</option>
                <option value="del">- DEL</option>
              </select>
              <input
                value={change.text}
                onChange={(e) => {
                  const changes = [...form.changes];
                  changes[idx] = { ...change, text: e.target.value };
                  setForm({ ...form, changes });
                }}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, changes: form.changes.filter((c) => c.id !== change.id) })
                }
                className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-danger)] shrink-0 px-2"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setForm({
              ...form,
              changes: [...form.changes, { id: newChangeId(), type: "add", text: "" }],
            })
          }
          className="mt-2 text-xs uppercase tracking-widest px-3 py-1.5 border border-[var(--color-line)] glass-chip text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          + {t("field.changes")}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <label>
          <span className={labelCls} style={{ fontFamily: "var(--font-mono)" }}>
            {t("field.files_changed")}
          </span>
          <input
            inputMode="numeric"
            value={form.filesChanged}
            onChange={(e) => setForm({ ...form, filesChanged: e.target.value })}
            className={inputCls}
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </label>
        <label>
          <span className={labelCls} style={{ fontFamily: "var(--font-mono)" }}>
            {t("field.lines_add")}
          </span>
          <input
            inputMode="numeric"
            value={form.linesAdd}
            onChange={(e) => setForm({ ...form, linesAdd: e.target.value })}
            className={inputCls}
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </label>
        <label>
          <span className={labelCls} style={{ fontFamily: "var(--font-mono)" }}>
            {t("field.lines_del")}
          </span>
          <input
            inputMode="numeric"
            value={form.linesDel}
            onChange={(e) => setForm({ ...form, linesDel: e.target.value })}
            className={inputCls}
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isNow}
          onChange={(e) => setForm({ ...form, isNow: e.target.checked })}
          className="accent-[var(--color-accent)]"
        />
        <span className="text-sm text-[var(--color-ink)]">{t("field.is_now")}</span>
      </label>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="text-xs uppercase tracking-widest px-5 py-2.5 bg-[var(--color-accent)] text-[var(--color-bg)] font-medium disabled:opacity-40"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {pending ? "…" : isNew ? t("create_button") : t("save_button")}
        </button>
        <button
          type="button"
          onClick={() => router.push(cancelHref)}
          className="text-xs uppercase tracking-widest px-5 py-2.5 border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {t("cancel_button")}
        </button>
      </div>
    </form>
  );
}

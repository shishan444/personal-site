"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ChipInput, FormField, TextareaField } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { countWords, readingTime, renderMarkdownToHtml } from "@/lib/markdown";

export interface EssayEditorInitial {
  sn: string;
  title: string;
  deck: string;
  body: string;
  typeTag: "essay" | "note" | "tutorial";
  topicTags: string[];
  status: "draft" | "published" | "archived";
  slug: string | null;
  lang: "zh" | "en";
}

export interface EssayEditorProps {
  action: (formData: FormData) => Promise<void>;
  initial: EssayEditorInitial;
  isNew?: boolean;
}

export function EssayEditor({ action, initial, isNew }: EssayEditorProps) {
  const [state, formAction] = useFormState<void, FormData>(async (_prev, formData) => {
    await action(formData);
  }, undefined);
  const [body, setBody] = useState(initial.body);
  const [topicTags, setTopicTags] = useState<string[]>(initial.topicTags);
  const [preview, setPreview] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const words = useMemo(() => countWords(body), [body]);
  const minutes = readingTime(words);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(async () => {
      const html = await renderMarkdownToHtml(body);
      if (!cancelled) setPreview(html);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [body]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-[100px_1fr] gap-3">
            <FormField id="sn" name="sn" label="SN" defaultValue={initial.sn} required />
            <FormField id="lang" name="lang" label="Lang" defaultValue={initial.lang} />
          </div>

          <FormField
            id="title"
            name="title"
            label="Title (supports <em>)"
            defaultValue={initial.title}
            required
          />

          <TextareaField
            id="deck"
            name="deck"
            label="Deck"
            defaultValue={initial.deck}
            rows={2}
            required
          />

          <div className="space-y-1.5">
            <label
              className="block text-xs uppercase tracking-widest text-[var(--color-ink-soft)] font-mono"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Body (Markdown)
            </label>
            <div className="flex items-center justify-between text-[10px] text-[var(--color-ink-soft)] font-mono mb-1">
              <span>
                {words} 字 · {minutes} 分钟
              </span>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="hover:text-[var(--color-accent)]"
              >
                {showPreview ? "编辑" : "预览"}
              </button>
            </div>
            {showPreview ? (
              <div
                className="min-h-[400px] border border-[var(--color-line)] p-4 prose prose-invert max-w-none text-[var(--color-ink)]"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            ) : (
              <textarea
                name="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                className="w-full bg-transparent border border-[var(--color-line)] px-3 py-2 text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] min-h-[400px] font-mono text-sm"
                style={{ fontFamily: "var(--font-mono)" }}
              />
            )}
          </div>

          <input type="hidden" name="topicTags" value={JSON.stringify(topicTags)} />
          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-widest text-[var(--color-ink-soft)] font-mono">
              Topic Tags
            </label>
            <ChipInput value={topicTags} onChange={setTopicTags} placeholder="AI, Agent..." />
          </div>
        </div>

        <aside className="space-y-4 border-l border-[var(--color-line)] pl-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--color-ink-soft)] mb-1.5 font-mono">
              Type
            </label>
            <select
              name="typeTag"
              defaultValue={initial.typeTag}
              className="w-full bg-transparent border border-[var(--color-line)] px-3 py-2 text-[var(--color-ink)]"
            >
              <option value="essay">Essay</option>
              <option value="note">Note</option>
              <option value="tutorial">Tutorial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--color-ink-soft)] mb-1.5 font-mono">
              Status
            </label>
            <select
              name="status"
              defaultValue={initial.status}
              className="w-full bg-transparent border border-[var(--color-line)] px-3 py-2 text-[var(--color-ink)]"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <FormField
            id="slug"
            name="slug"
            label="Slug"
            defaultValue={initial.slug ?? ""}
            placeholder="my-essay-zh"
          />

          <SubmitButton isNew={isNew} />
        </aside>
      </div>
      {state !== undefined && <div className="text-xs text-[var(--color-accent-2)]">✓ Saved</div>}
    </form>
  );
}

function SubmitButton({ isNew }: { isNew?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving…" : isNew ? "Create" : "Save"}
    </Button>
  );
}

"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations();
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
            <FormField
              id="sn"
              name="sn"
              label={t("admin.essay.field.sn")}
              defaultValue={initial.sn}
              required
            />
            <FormField
              id="lang"
              name="lang"
              label={t("admin.essay.field.lang")}
              defaultValue={initial.lang}
            />
          </div>

          <FormField
            id="title"
            name="title"
            label={t("admin.essay.field.title")}
            defaultValue={initial.title}
            required
          />

          <TextareaField
            id="deck"
            name="deck"
            label={t("admin.essay.field.deck")}
            defaultValue={initial.deck}
            rows={2}
            required
          />

          <div className="space-y-1.5">
            <label
              className="block text-xs uppercase tracking-widest text-[var(--color-ink-soft)] font-mono"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {t("admin.essay.field.body")}
            </label>
            <div className="flex items-center justify-between text-[10px] text-[var(--color-ink-soft)] font-mono mb-1">
              <span>
                {words} {t("common.unit.words", { count: words })} · {minutes}{" "}
                {t("common.unit.minutes", { count: minutes })}
              </span>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="hover:text-[var(--color-accent)]"
              >
                {showPreview ? t("common.button.edit") : t("common.button.preview")}
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
              {t("admin.essay.field.topic_tags")}
            </label>
            <ChipInput
              value={topicTags}
              onChange={setTopicTags}
              placeholder={t("admin.essay.placeholder_topic_tags")}
            />
          </div>
        </div>

        <aside className="space-y-4 border-l border-[var(--color-line)] pl-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--color-ink-soft)] mb-1.5 font-mono">
              {t("admin.essay.field.type")}
            </label>
            <select
              name="typeTag"
              defaultValue={initial.typeTag}
              className="w-full bg-transparent border border-[var(--color-line)] px-3 py-2 text-[var(--color-ink)]"
            >
              <option value="essay">{t("admin.enum.essay_type.essay")}</option>
              <option value="note">{t("admin.enum.essay_type.note")}</option>
              <option value="tutorial">{t("admin.enum.essay_type.tutorial")}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--color-ink-soft)] mb-1.5 font-mono">
              {t("admin.essay.field.status")}
            </label>
            <select
              name="status"
              defaultValue={initial.status}
              className="w-full bg-transparent border border-[var(--color-line)] px-3 py-2 text-[var(--color-ink)]"
            >
              <option value="draft">{t("admin.enum.essay_status.draft")}</option>
              <option value="published">{t("admin.enum.essay_status.published")}</option>
              <option value="archived">{t("admin.enum.essay_status.archived")}</option>
            </select>
          </div>

          <FormField
            id="slug"
            name="slug"
            label={t("admin.essay.field.slug")}
            defaultValue={initial.slug ?? ""}
            placeholder={t("admin.essay.placeholder_slug")}
          />

          <SubmitButton isNew={isNew} />
        </aside>
      </div>
      {state !== undefined && (
        <div className="text-xs text-[var(--color-accent-2)]">{t("admin.common.saved")}</div>
      )}
    </form>
  );
}

function SubmitButton({ isNew }: { isNew?: boolean }) {
  const t = useTranslations();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending
        ? t("admin.common.saving")
        : isNew
          ? t("admin.common.create")
          : t("admin.common.save")}
    </Button>
  );
}

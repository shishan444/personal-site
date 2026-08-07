import { getTranslations, setRequestLocale } from "next-intl/server";
import { TagMergeForm } from "@/components/admin/tag-merge-form";
import { getDb } from "@/lib/db";
import { essays } from "@/lib/db/schema";

export default async function AdminTagsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const db = await getDb();
  const allEssays = await db.select().from(essays);

  const tagCount = new Map<string, number>();
  for (const e of allEssays) {
    for (const tag of e.topicTags) {
      tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
    }
  }
  const sorted = Array.from(tagCount.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-4xl space-y-6">
      <h1
        className="text-3xl font-bold tracking-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {t("admin.sidebar_tags")}
      </h1>
      <p
        className="text-xs text-[var(--color-ink-soft)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {t("admin.tags_page.subtitle", { count: allEssays.length })}
      </p>
      <TagMergeForm tags={sorted.map(([tag]) => tag)} />
      {sorted.length === 0 ? (
        <div
          className="border border-dashed border-[var(--color-line)] p-12 text-center text-[var(--color-ink-soft)] text-sm"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          — {t("common.label.empty")} —
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sorted.map(([tag, count]) => (
            <span
              key={tag}
              className="inline-flex items-center gap-2 border border-[var(--color-line)] px-3 py-1.5 text-sm"
            >
              <span className="text-[var(--color-ink)]">{tag}</span>
              <span
                className="text-[10px] text-[var(--color-ink-soft)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                ×{count}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

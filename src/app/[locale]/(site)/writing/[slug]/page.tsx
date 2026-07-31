import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { StatusBadge } from "@/components/shared";
import { getPgliteDb } from "@/lib/db/pglite";
import { agents } from "@/lib/db/schema";
import {
  getAdjacentEssays,
  getEssayAttachments,
  getEssayBySlug,
  getEssayTranslationSlug,
} from "@/lib/queries/detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const essay = await getEssayBySlug(slug, locale);
  if (!essay) return { title: "Not found" };
  return {
    title: essay.ogTitle ?? essay.title.replace(/<\/?em>/g, ""),
    description: essay.ogDescription ?? essay.deck,
  };
}

export default async function EssayDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const essay = await getEssayBySlug(slug, locale);
  if (!essay) notFound();

  const [{ prev, next }, _translationSlug, attachments] = await Promise.all([
    getAdjacentEssays(essay.publishedAt ?? new Date(), locale),
    getEssayTranslationSlug(essay.translationGroupId, locale === "zh" ? "en" : "zh", essay.id),
    getEssayAttachments(essay.id),
  ]);

  let relatedAgent: { sn: string; name: string } | null = null;
  if (essay.relatedAgentId) {
    const db = await getPgliteDb();
    const a = (
      await db.select().from(agents).where(eq(agents.id, essay.relatedAgentId)).limit(1)
    )[0];
    if (a) relatedAgent = { sn: a.sn, name: a.name };
  }

  return (
    <main className="min-h-screen px-6 md:px-12 py-16 max-w-3xl mx-auto">
      <div className="mb-12 space-y-4">
        <Link
          href={`/${locale}#02`}
          className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-soft)] hover:text-[var(--color-accent)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          ← {t("writing.detail_back")}
        </Link>
        <div className="flex items-center gap-3">
          <StatusBadge variant="warn">{t(`writing.tag_${essay.typeTag}`)}</StatusBadge>
          <span
            className="text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {essay.sn} · {essay.words} 字 · {essay.readMinutes} 分钟
          </span>
        </div>
      </div>

      <h1
        className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-[var(--color-ink)] mb-6"
        style={{ fontFamily: "var(--font-display)" }}
        dangerouslySetInnerHTML={{ __html: essay.title }}
      />

      <p
        className="text-xl text-[var(--color-ink-mute)] mb-12 leading-relaxed"
        style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
      >
        {essay.deck}
      </p>

      <article
        className="prose prose-invert max-w-none text-[var(--color-ink)] leading-relaxed space-y-4"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {essay.body.split(/\n\n+/).map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}
      </article>

      {attachments.length > 0 && (
        <section className="mt-16 pt-8 border-t border-[var(--color-line)]">
          <h2
            className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-soft)] mb-4"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t("writing.attachments_title")}
          </h2>
          <ul className="space-y-2">
            {attachments.map((a) => (
              <li key={a.id}>
                <a
                  href={a.url}
                  className="text-sm text-[var(--color-accent)] hover:underline"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  ↓ {a.filename} ({Math.round(a.sizeBytes / 1024)} KB)
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedAgent && (
        <section className="mt-16 pt-8 border-t border-[var(--color-line)]">
          <h2
            className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-soft)] mb-4"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t("writing.detail_related_agent")}
          </h2>
          <Link
            href={`/${locale}/agents/${relatedAgent.sn}`}
            className="text-lg text-[var(--color-accent)] hover:underline"
            style={{ fontFamily: "var(--font-display)" }}
            dangerouslySetInnerHTML={{ __html: relatedAgent.name }}
          />
        </section>
      )}

      <nav className="mt-16 pt-8 border-t border-[var(--color-line)] flex items-center justify-between gap-4">
        <div>
          {prev?.slug && (
            <Link
              href={`/${locale}/writing/${prev.slug}`}
              className="text-sm text-[var(--color-ink-mute)] hover:text-[var(--color-accent)]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              ← {prev.title.replace(/<\/?em>/g, "")}
            </Link>
          )}
        </div>
        <div>
          {next?.slug && (
            <Link
              href={`/${locale}/writing/${next.slug}`}
              className="text-sm text-[var(--color-ink-mute)] hover:text-[var(--color-accent)]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {next.title.replace(/<\/?em>/g, "")} →
            </Link>
          )}
        </div>
      </nav>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { getAgentBySn, getAgentScreenshots, getRelatedEssays } from "@/lib/queries/detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; sn: string }>;
}) {
  const { sn } = await params;
  const agent = await getAgentBySn(sn);
  if (!agent) return { title: "Not found" };
  return { title: agent.name.replace(/<\/?em>/g, ""), description: agent.desc };
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; sn: string }>;
}) {
  const { locale, sn } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const agent = await getAgentBySn(sn);
  if (!agent) notFound();

  const [screenshots, relatedEssays] = await Promise.all([
    getAgentScreenshots(agent.id),
    getRelatedEssays(agent.id, locale),
  ]);

  const statusVariant: Record<typeof agent.status, "active" | "warn" | "neutral" | "archived"> = {
    active: "active",
    beta: "warn",
    coming: "neutral",
    archived: "archived",
  };

  return (
    <main className="min-h-screen px-6 md:px-12 py-16 max-w-5xl mx-auto">
      <div className="mb-12">
        <Link
          href={`/${locale}#03`}
          className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-soft)] hover:text-[var(--color-accent)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          ← {t("agent.detail_back")}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 mb-16">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <StatusBadge variant={statusVariant[agent.status]} dot>
              {t(`agent.status_${agent.status}`)}
            </StatusBadge>
            <span
              className="text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {agent.sn}
            </span>
          </div>
          <h1
            className="text-5xl md:text-6xl font-bold leading-tight tracking-tight text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
            dangerouslySetInnerHTML={{ __html: agent.name }}
          />
          <p
            className="text-lg text-[var(--color-ink-mute)] leading-relaxed"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {agent.desc}
          </p>
        </div>

        <aside className="space-y-3 border-l border-[var(--color-line)] pl-6">
          <div
            className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-accent)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            SPECS
          </div>
          {agent.specs.map((spec) => (
            <div key={spec.id} className="space-y-1 border-b border-[var(--color-line)]/40 pb-2">
              <div
                className={`text-[10px] uppercase tracking-widest ${
                  spec.isPrimary ? "text-[var(--color-accent)]" : "text-[var(--color-ink-soft)]"
                }`}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {spec.label}
              </div>
              <div
                className={`text-sm ${spec.isPrimary ? "text-[var(--color-ink)]" : "text-[var(--color-ink-mute)]"}`}
                style={{ fontFamily: spec.isPrimary ? "var(--font-display)" : "var(--font-mono)" }}
              >
                {spec.value}
              </div>
            </div>
          ))}
          {agent.launchUrl && agent.status !== "coming" && (
            <Button asChild className="w-full mt-4">
              <a href={agent.launchUrl} target="_blank" rel="noreferrer">
                {t("agent.button_deploy")}
              </a>
            </Button>
          )}
        </aside>
      </div>

      {agent.longDesc && (
        <section className="mb-16 max-w-3xl">
          <h2
            className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-accent)] mb-4"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t("agent.detail_how_works")}
          </h2>
          <article
            className="prose prose-invert max-w-none text-[var(--color-ink)] leading-relaxed space-y-4"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {agent.longDesc.split(/\n\n+/).map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </article>
        </section>
      )}

      {screenshots.length > 0 && (
        <section className="mb-16">
          <h2
            className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-accent)] mb-4"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t("agent.detail_screenshots")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {screenshots.map((s) => (
              <figure key={s.id} className="border border-[var(--color-line)]">
                <img src={s.url} alt={s.caption ?? ""} className="w-full" />
                {s.caption && (
                  <figcaption
                    className="text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)] p-2"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {s.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}

      {relatedEssays.length > 0 && (
        <section>
          <h2
            className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-accent)] mb-4"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t("agent.detail_related_essays")}
          </h2>
          <ul className="space-y-2">
            {relatedEssays.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/${locale}/writing/${e.slug}`}
                  className="text-sm text-[var(--color-ink)] hover:text-[var(--color-accent)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {e.sn} · {e.title.replace(/<\/?em>/g, "")}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

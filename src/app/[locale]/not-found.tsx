import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-8 text-center">
      <div
        className="text-[clamp(120px,30vw,300px)] font-bold leading-[0.85] text-[var(--color-bg-3)] select-none"
        style={{ fontFamily: "var(--font-display)" }}
      >
        404
      </div>
      <div
        className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        ERROR · {t("error.404_title")}
      </div>
      <h1
        className="text-4xl md:text-6xl font-bold leading-tight tracking-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {t("error.404_title")}
      </h1>
      <p
        className="text-sm text-[var(--color-ink-mute)] max-w-md"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {t("error.404_desc")}
      </p>
      <Link
        href={`/${locale}`}
        className="bg-[var(--color-accent)] text-[var(--color-bg)] px-6 py-3 uppercase tracking-widest text-xs hover:bg-[var(--color-ink)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        ← {t("error.404_back_home")}
      </Link>
    </main>
  );
}

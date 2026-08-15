import { getTranslations, setRequestLocale } from "next-intl/server";
import { TrashActions } from "@/components/admin/trash-actions";
import { listTrash } from "@/lib/actions/trash";

export default async function TrashPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.trash_page");
  const items = await listTrash();

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
        {t("title")}
      </h1>
      <p className="text-sm text-[var(--color-ink-mute)] mb-8">{t("hint")}</p>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-soft)] py-12 text-center">{t("empty")}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={`${item.kind}-${item.id}`}
              className="glass-panel glass-lift flex items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <div className="text-sm text-[var(--color-ink)] truncate">{item.title}</div>
                <div
                  className="text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)] mt-1"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {t(`kind_${item.kind}`)} · {item.meta} ·{" "}
                  {item.deletedAt.toISOString().slice(0, 16).replace("T", " ")}
                </div>
              </div>
              <TrashActions kind={item.kind} id={item.id} title={item.title} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

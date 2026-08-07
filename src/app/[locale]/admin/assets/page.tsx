import { getTranslations, setRequestLocale } from "next-intl/server";
import { listAssetsForAdmin, softDeleteAsset } from "@/lib/actions/assets";

export default async function AdminAssetsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const assets = await listAssetsForAdmin();

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t("admin.sidebar_assets")}
        </h1>
        <p
          className="text-xs text-[var(--color-ink-soft)] mt-1"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {t("admin.assets_page.subtitle", { count: assets.length })}
        </p>
      </div>

      {assets.length === 0 ? (
        <div
          className="border border-dashed border-[var(--color-line)] p-12 text-center text-[var(--color-ink-soft)] text-sm"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          — {t("common.label.empty")} —
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {assets.map((a) => (
            <div key={a.id} className="glass-panel glass-lift p-3 space-y-2">
              {a.mimeType.startsWith("image/") ? (
                <div className="aspect-square bg-[var(--color-bg-3)] overflow-hidden">
                  <img
                    src={a.publicUrl}
                    alt={a.originalFilename}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center bg-[var(--color-bg-3)]">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)]">
                    {a.mimeType}
                  </span>
                </div>
              )}
              <div
                className="text-[10px] truncate text-[var(--color-ink)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {a.originalFilename}
              </div>
              <div
                className="text-[9px] text-[var(--color-ink-soft)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {Math.round(a.sizeBytes / 1024)} KB
              </div>
              <form
                action={async () => {
                  "use server";
                  const r = await softDeleteAsset(a.id);
                  if (!r.ok) {
                    throw new Error(`Cannot delete: ${r.reason}`);
                  }
                }}
              >
                <button
                  type="submit"
                  className="text-[10px] uppercase tracking-widest text-[var(--color-danger)] hover:underline"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  ✕ DELETE
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

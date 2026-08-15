"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "@/components/ui/toaster";
import { purgeFromTrash, restoreFromTrash } from "@/lib/actions/trash";

export function TrashActions({
  kind,
  id,
  title,
}: {
  kind: "essay" | "agent" | "asset";
  id: string;
  title: string;
}) {
  const t = useTranslations("admin.trash_page");
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() =>
            restoreFromTrash(kind, id)
              .then(() => {
                toast.success(t("toast_restored"), title);
              })
              .catch(() => {
                toast.error(t("toast_failed"));
              }),
          )
        }
        className="text-xs uppercase tracking-widest px-3 py-2 border border-[var(--color-line)] glass-chip text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-40"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {t("restore")}
      </button>
      {confirming ? (
        <span className="flex items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(() =>
                purgeFromTrash(kind, id)
                  .then((r) => {
                    setConfirming(false);
                    if (r.ok) {
                      toast.success(t("toast_purged"), title);
                    } else {
                      toast.error(t("toast_failed"));
                    }
                  })
                  .catch(() => {
                    toast.error(t("toast_failed"));
                  }),
              )
            }
            className="text-xs uppercase tracking-widest px-3 py-2 border border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 disabled:opacity-40"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t("purge_confirm")}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          >
            {t("cancel")}
          </button>
        </span>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(true)}
          title={title}
          className="text-xs uppercase tracking-widest px-3 py-2 border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:text-[var(--color-danger)] hover:border-[var(--color-danger)] disabled:opacity-40"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {t("purge")}
        </button>
      )}
    </div>
  );
}

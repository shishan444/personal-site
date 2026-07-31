"use client";

import { LogOut, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";

export function Topbar({ userEmail }: { userEmail: string | null }) {
  const t = useTranslations();
  const [pending, setPending] = useState(false);

  return (
    <header className="border-b border-[var(--color-line)] bg-[var(--color-bg-2)] flex items-center justify-between px-6 h-14">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rotate-45 bg-[var(--color-accent)]" />
        <span
          className="text-sm font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          ATELIER
        </span>
        <span
          className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          ADMIN
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 border border-[var(--color-line)] px-3 py-1.5 text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)]">
          <Search className="w-3 h-3" />
          <span style={{ fontFamily: "var(--font-mono)" }}>
            {t("admin.topbar_search_placeholder")}
          </span>
          <span
            className="ml-4 px-1.5 py-0.5 border border-[var(--color-line)] text-[9px]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t("admin.topbar_search_shortcut")}
          </span>
        </div>

        <span
          className="text-xs text-[var(--color-ink-mute)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {userEmail}
        </span>

        <form
          action={async () => {
            setPending(true);
            await logoutAction();
          }}
        >
          <Button variant="ghost" size="sm" type="submit" disabled={pending}>
            <LogOut className="w-3 h-3" />
            {t("auth.logout")}
          </Button>
        </form>
      </div>
    </header>
  );
}

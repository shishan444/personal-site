"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";

export function Topbar({ userEmail }: { userEmail: string | null }) {
  const t = useTranslations();
  const [pending, setPending] = useState(false);

  return (
    <header className="border-b border-[var(--color-line)] glass-bar flex items-center justify-between px-6 h-14">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rotate-45 bg-[var(--color-accent)]" />
        <span
          className="text-sm font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          ATELIER
        </span>
      </div>

      <div className="flex items-center gap-3">
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

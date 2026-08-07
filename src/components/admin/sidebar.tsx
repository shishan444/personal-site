"use client";

import {
  Clock,
  FileText,
  Folder,
  Image,
  LayoutDashboard,
  Settings,
  Sparkles,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";

export function Sidebar({ locale }: { locale: string }) {
  const t = useTranslations();
  const pathname = usePathname();

  const mainItems = [
    { href: `/${locale}/admin`, label: t("admin.sidebar_dashboard"), icon: LayoutDashboard },
    { href: `/${locale}/admin/writing`, label: t("admin.sidebar_writing"), icon: FileText },
    { href: `/${locale}/admin/agents`, label: t("admin.sidebar_agents"), icon: Sparkles },
    { href: `/${locale}/admin/timeline`, label: t("admin.sidebar_timeline"), icon: Clock },
  ];

  const systemItems = [
    { href: `/${locale}/admin/assets`, label: t("admin.sidebar_assets"), icon: Image },
    { href: `/${locale}/admin/tags`, label: t("admin.sidebar_tags"), icon: Tag },
    { href: `/${locale}/admin/settings`, label: t("admin.sidebar_settings"), icon: Settings },
    { href: `/${locale}/admin/logs`, label: t("admin.sidebar_logs"), icon: Folder },
  ];

  return (
    <aside className="w-56 border-r border-[var(--color-line)] glass-bar flex flex-col py-4">
      <SidebarGroup label={t("admin.sidebar_section_main")} items={mainItems} pathname={pathname} />
      <SidebarGroup
        label={t("admin.sidebar_section_system")}
        items={systemItems}
        pathname={pathname}
      />
    </aside>
  );
}

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

function SidebarGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: SidebarItem[];
  pathname: string;
}) {
  return (
    <div className="px-3 mb-6">
      <div
        className="px-2 mb-2 text-[9px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </div>
      <nav className="space-y-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2 py-1.5 text-sm transition-colors border-l-2",
                isActive
                  ? "border-l-[var(--color-accent)] bg-[var(--color-glass)] text-[var(--color-ink)]"
                  : "border-l-transparent text-[var(--color-ink-mute)] hover:bg-[var(--color-glass)] hover:text-[var(--color-ink)]",
              )}
              style={{ fontFamily: "var(--font-body)" }}
            >
              <Icon className="w-3.5 h-3.5 opacity-70" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

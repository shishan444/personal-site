export interface ChapterConfig {
  id: string;
  name: string;
  order: number;
  required: boolean;
  /** 站点设置开关（schema site_config.chapters_config 透传）；默认开启。 */
  enabled?: boolean;
}

export const DEFAULT_CHAPTERS: ChapterConfig[] = [
  { id: "01", name: "HERO", order: 1, required: true, enabled: true },
  { id: "02", name: "WRITING", order: 2, required: false, enabled: true },
  { id: "03", name: "AGENTS", order: 3, required: false, enabled: true },
  { id: "04", name: "TIMELINE", order: 4, required: false, enabled: true },
  { id: "05", name: "OUTRO", order: 5, required: true, enabled: true },
];

/** 站点配置驱动的前台章节序列：enabled 过滤 + order 排序；配置缺失回退默认五章节。 */
export function resolveChapters(
  configured: Array<Omit<ChapterConfig, "enabled"> & { enabled?: boolean }> | null | undefined,
): ChapterConfig[] {
  if (!configured || configured.length === 0) return DEFAULT_CHAPTERS;
  const active = configured
    .filter((c) => c.enabled !== false)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ ...c, enabled: c.enabled ?? true }));
  return active.length > 0 ? active : DEFAULT_CHAPTERS;
}

/** globalStats 模板插值：{agents_active} 等占位符 → 实时值（spec 8.6）。 */
export function renderStatsTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

export interface ChapterMeta {
  id: string;
  name: string;
  index: number;
  total: number;
}

export function chapterMeta(chapters: ChapterConfig[], activeId: string): ChapterMeta | null {
  const idx = chapters.findIndex((c) => c.id === activeId);
  if (idx < 0) return null;
  return {
    id: chapters[idx].id,
    name: chapters[idx].name,
    index: idx + 1,
    total: chapters.length,
  };
}

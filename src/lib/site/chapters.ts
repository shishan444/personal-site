export interface ChapterConfig {
  id: string;
  name: string;
  order: number;
  required: boolean;
}

export const DEFAULT_CHAPTERS: ChapterConfig[] = [
  { id: "01", name: "HERO", order: 1, required: true },
  { id: "02", name: "WRITING", order: 2, required: false },
  { id: "03", name: "AGENTS", order: 3, required: false },
  { id: "04", name: "TIMELINE", order: 4, required: false },
  { id: "05", name: "OUTRO", order: 5, required: true },
];

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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActiveSection } from "@/hooks/use-active-section";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { type ChapterConfig, DEFAULT_CHAPTERS } from "@/lib/site/chapters";
import { LdSubdial } from "./ld-subdial";
import { LuSubdial } from "./lu-subdial";
import { RdSubdial } from "./rd-subdial";
import { RuSubdial } from "./ru-subdial";

export interface SubdialFrameProps {
  chapters?: ChapterConfig[];
  chapterMetas?: Record<string, { eyebrow: string; title: string; desc?: string }>;
  rdMetaLine1?: string;
  rdMetaLine2?: string;
}

export function SubdialFrame({
  chapters = DEFAULT_CHAPTERS,
  chapterMetas = {},
  rdMetaLine1,
  rdMetaLine2,
}: SubdialFrameProps) {
  const scroll = useScrollProgress();
  const sectionIds = useMemo(() => chapters.map((c) => c.id), [chapters]);
  const activeId = useActiveSection(sectionIds);
  const [visited, setVisited] = useState<Set<string>>(new Set());

  const lastVisitedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!activeId) return;
    const next = new Set(lastVisitedRef.current);
    next.add(activeId);
    lastVisitedRef.current = next;
    setVisited(next);
  }, [activeId]);

  const activeIndex = activeId ? chapters.findIndex((c) => c.id === activeId) : 0;
  const activeChapter = chapters[activeIndex] ?? chapters[0];
  const meta = chapterMetas[activeChapter?.id ?? ""];

  return (
    <>
      <div className="fixed top-6 left-6 z-40 pointer-events-none">
        <LuSubdial
          index={activeIndex + 1}
          total={chapters.length}
          chapterId={activeChapter?.id ?? ""}
          chapterName={activeChapter?.name ?? ""}
          visible={Boolean(activeId)}
        />
      </div>
      <div className="fixed top-6 right-6 z-40 pointer-events-none">
        <RuSubdial chapterIds={sectionIds} activeId={activeId} visitedIds={visited} />
      </div>
      <div className="fixed bottom-6 left-6 z-40 pointer-events-none">
        {meta && (
          <LdSubdial
            eyebrow={meta.eyebrow}
            title={meta.title}
            desc={meta.desc}
            visible={Boolean(activeId)}
          />
        )}
      </div>
      <div className="fixed bottom-6 right-6 z-40 pointer-events-none">
        <RdSubdial progress={scroll.ratio} metaLine1={rdMetaLine1} metaLine2={rdMetaLine2} />
      </div>
    </>
  );
}

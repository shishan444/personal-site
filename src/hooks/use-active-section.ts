"use client";

import { useEffect, useState } from "react";

export interface ActiveSectionOptions {
  rootMargin?: string;
  threshold?: number | number[];
}

export function useActiveSection(
  sectionIds: string[],
  options: ActiveSectionOptions = {},
): string | null {
  const { rootMargin = "-50% 0px -50% 0px", threshold = 0 } = options;
  const [activeId, setActiveId] = useState<string | null>(sectionIds[0] ?? null);
  const joinedIds = sectionIds.join(",");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin, threshold },
    );

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    for (const el of elements) observer.observe(el);

    return () => observer.disconnect();
    // biome-ignore lint/correctness/useExhaustiveDependencies: joinedIds 是 stable string 派生
  }, [rootMargin, threshold, joinedIds]);

  return activeId;
}

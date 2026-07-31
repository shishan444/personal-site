"use client";

import { useEffect, useRef, useState } from "react";
import { useRafThrottle } from "./use-raf-throttle";

export interface ScrollProgress {
  ratio: number;
  scrollY: number;
  viewportHeight: number;
  documentHeight: number;
}

export function useScrollProgress(): ScrollProgress {
  const [progress, setProgress] = useState<ScrollProgress>({
    ratio: 0,
    scrollY: 0,
    viewportHeight: 0,
    documentHeight: 0,
  });

  const compute = useRafThrottle(() => {
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const maxScroll = Math.max(1, documentHeight - viewportHeight);
    const ratio = Math.min(1, Math.max(0, scrollY / maxScroll));
    setProgress({ ratio, scrollY, viewportHeight, documentHeight });
  });

  useEffect(() => {
    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [compute]);

  return progress;
}

export function useScrollProgressRef() {
  const ref = useRef<ScrollProgress>({
    ratio: 0,
    scrollY: 0,
    viewportHeight: 0,
    documentHeight: 0,
  });
  const compute = useRafThrottle(() => {
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const maxScroll = Math.max(1, documentHeight - viewportHeight);
    ref.current = {
      ratio: Math.min(1, Math.max(0, scrollY / maxScroll)),
      scrollY,
      viewportHeight,
      documentHeight,
    };
  });
  useEffect(() => {
    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [compute]);
  return ref;
}

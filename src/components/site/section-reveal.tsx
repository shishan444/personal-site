"use client";

import { createElement, useEffect, useRef, useState } from "react";

export interface SectionRevealProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  threshold?: number;
  as?: "section" | "div" | "article" | "main" | "header" | "footer";
}

export function SectionReveal({
  id,
  children,
  className,
  activeClassName,
  threshold = 0.2,
  as = "section",
}: SectionRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setVisible(e.isIntersecting);
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return createElement(
    as,
    {
      ref,
      id,
      className: `${className ?? ""} ${visible ? (activeClassName ?? "is-visible") : "is-hidden"}`,
      "data-reveal": visible ? "visible" : "hidden",
    },
    children,
  );
}

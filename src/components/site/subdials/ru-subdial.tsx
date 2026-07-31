"use client";

export interface RuSubdialProps {
  chapterIds: string[];
  activeId: string | null;
  visitedIds: Set<string>;
}

export function RuSubdial({ chapterIds, activeId, visitedIds }: RuSubdialProps) {
  return (
    <div className="flex flex-col items-end gap-1 select-none">
      <div
        className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-soft)] mb-1"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        IDX
      </div>
      <div className="flex items-end gap-1.5">
        {chapterIds.map((id, idx) => {
          const isActive = id === activeId;
          const isVisited = visitedIds.has(id);
          return (
            <div
              key={id}
              className="flex flex-col items-center gap-0.5"
              aria-label={`chapter ${idx + 1} ${id} ${isActive ? "active" : isVisited ? "passed" : "pending"}`}
            >
              <span
                className={`text-[8px] uppercase tracking-widest transition-colors ${
                  isActive
                    ? "text-[var(--color-accent)]"
                    : isVisited
                      ? "text-[var(--color-ink-mute)]"
                      : "text-[var(--color-ink-soft)]"
                }`}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div
                className={`w-0.5 transition-all duration-300 ${
                  isActive
                    ? "h-6 bg-[var(--color-accent)]"
                    : isVisited
                      ? "h-3 bg-[var(--color-ink-mute)]"
                      : "h-1.5 bg-[var(--color-ink-soft)]/40"
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

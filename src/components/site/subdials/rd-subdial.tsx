"use client";

export interface RdSubdialProps {
  progress: number;
  metaLine1?: string;
  metaLine2?: string;
}

const RING_RADIUS = 36;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function RdSubdial({ progress, metaLine1, metaLine2 }: RdSubdialProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  const dashOffset = RING_CIRCUMFERENCE * (1 - clamped);
  const needleRotation = -90 + clamped * 360;

  return (
    <div className="flex items-center gap-3 select-none glass-panel p-2.5">
      <div className="relative" style={{ width: 92, height: 92 }}>
        <svg
          width="92"
          height="92"
          viewBox="0 0 92 92"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label={`scroll progress ${Math.round(clamped * 100)}%`}
        >
          <circle
            cx="46"
            cy="46"
            r={RING_RADIUS}
            stroke="var(--color-line)"
            strokeWidth="1"
            fill="none"
          />
          <circle
            cx="46"
            cy="46"
            r={RING_RADIUS}
            stroke="var(--color-accent)"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 46 46)"
            style={{ transition: "stroke-dashoffset 80ms linear" }}
          />
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const x1 = 46 + Math.cos(angle) * (RING_RADIUS - 4);
            const y1 = 46 + Math.sin(angle) * (RING_RADIUS - 4);
            const x2 = 46 + Math.cos(angle) * (RING_RADIUS - 1);
            const y2 = 46 + Math.sin(angle) * (RING_RADIUS - 1);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--color-ink-soft)"
                strokeWidth="0.5"
              />
            );
          })}
          <line
            x1="46"
            y1="46"
            x2={46 + Math.cos((needleRotation * Math.PI) / 180) * (RING_RADIUS - 6)}
            y2={46 + Math.sin((needleRotation * Math.PI) / 180) * (RING_RADIUS - 6)}
            stroke="var(--color-accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            style={{ transition: "transform 80ms linear", transformOrigin: "46px 46px" }}
          />
          <circle cx="46" cy="46" r="2" fill="var(--color-accent)" />
        </svg>
      </div>
      <div className="flex flex-col gap-0.5">
        {metaLine1 && (
          <div
            className="text-[9px] uppercase tracking-[0.15em] text-[var(--color-ink-mute)] whitespace-nowrap"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {metaLine1}
          </div>
        )}
        {metaLine2 && (
          <div
            className="text-[9px] uppercase tracking-[0.15em] text-[var(--color-ink-soft)] whitespace-nowrap"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {metaLine2}
          </div>
        )}
      </div>
    </div>
  );
}

export { RING_CIRCUMFERENCE, RING_RADIUS };

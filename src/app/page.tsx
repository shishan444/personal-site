export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-8">
      <div className="w-3 h-3 rotate-45 bg-[var(--color-accent)]" />
      <h1
        className="text-5xl md:text-7xl font-bold tracking-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Hello Atelier
      </h1>
      <p
        className="text-sm uppercase tracking-[0.3em] text-[var(--color-ink-mute)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        v0.4 · 阶段二已启动
      </p>
      <p
        className="text-base text-[var(--color-ink-mute)] max-w-md text-center"
        style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
      >
        A factory of agents, in kinetic motion.
      </p>
    </main>
  );
}

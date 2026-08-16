import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getAgentBySn } from "@/lib/queries/detail";

/** Agent 全页嵌入（launchType=iframe，spec 4.4 / 审计 #13）。 */
export default async function AgentUsePage({
  params,
}: {
  params: Promise<{ locale: string; sn: string }>;
}) {
  const { locale, sn } = await params;
  setRequestLocale(locale);
  const agent = await getAgentBySn(sn);
  if (!agent || !agent.launchUrl || agent.launchType !== "iframe") notFound();

  return (
    <main className="h-[100dvh] flex flex-col">
      <header className="flex items-center justify-between px-6 h-14 border-b border-[var(--color-line)] shrink-0">
        <span
          className="text-sm text-[var(--color-ink)] truncate"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {agent.name.replace(/<\/?em>/g, "")}
        </span>
        <a
          href={`/${locale}/agents/${sn}`}
          className="text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)] hover:text-[var(--color-accent)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          ← {agent.sn}
        </a>
      </header>
      <iframe
        src={agent.launchUrl}
        title={agent.name}
        className="flex-1 w-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </main>
  );
}

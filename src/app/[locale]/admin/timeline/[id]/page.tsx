import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TimelineEditor } from "@/components/admin/timeline-editor";
import { updateTimelineNode } from "@/lib/actions/timeline";
import { getDb } from "@/lib/db";
import { timelineNodes } from "@/lib/db/schema";

export default async function EditTimelineNodePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.timeline_node");

  const db = await getDb();
  const node = (await db.select().from(timelineNodes).where(eq(timelineNodes.id, id)).limit(1))[0];
  if (!node) notFound();

  async function save(input: Parameters<typeof updateTimelineNode>[1]) {
    "use server";
    await updateTimelineNode(id, input);
    return { ok: true };
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-8" style={{ fontFamily: "var(--font-display)" }}>
        {t("edit_title")} · {node.version}
      </h1>
      <TimelineEditor
        isNew={false}
        cancelHref={`/${locale}/admin/timeline`}
        onSubmit={save}
        initial={{
          version: node.version,
          name: node.name,
          desc: node.desc,
          type: node.type,
          date: node.date,
          changes: node.changes,
          filesChanged: node.filesChanged != null ? String(node.filesChanged) : "",
          linesAdd: node.linesAdd != null ? String(node.linesAdd) : "",
          linesDel: node.linesDel != null ? String(node.linesDel) : "",
          isNow: node.isNow,
        }}
      />
    </div>
  );
}

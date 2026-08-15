import { getTranslations, setRequestLocale } from "next-intl/server";
import { TimelineEditor } from "@/components/admin/timeline-editor";
import { createTimelineNode } from "@/lib/actions/timeline";

export default async function NewTimelineNodePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.timeline_node");

  async function save(input: Parameters<typeof createTimelineNode>[0]) {
    "use server";
    await createTimelineNode(input);
    return { ok: true };
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-8" style={{ fontFamily: "var(--font-display)" }}>
        {t("new_title")}
      </h1>
      <TimelineEditor
        isNew
        cancelHref={`/${locale}/admin/timeline`}
        onSubmit={save}
        initial={{
          version: "",
          name: "",
          desc: "",
          type: "normal",
          date: new Date().toISOString().slice(0, 7).replace("-", "."),
          changes: [],
          filesChanged: "",
          linesAdd: "",
          linesDel: "",
          isNow: false,
        }}
      />
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EssayEditor } from "@/components/admin/essay-editor";
import { EssayRevisions } from "@/components/admin/essay-revisions";
import { archiveEssay, deleteEssay, publishEssay, updateEssay } from "@/lib/actions/essays";
import { getEssayForEdit, listEssayRevisions } from "@/lib/queries/admin-list";

export default async function EditEssayPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const essay = await getEssayForEdit(id);
  if (!essay) notFound();
  const revisions = await listEssayRevisions(id);

  async function save(formData: FormData) {
    "use server";
    await updateEssay(id, {
      sn: String(formData.get("sn") ?? ""),
      title: String(formData.get("title") ?? ""),
      deck: String(formData.get("deck") ?? ""),
      body: String(formData.get("body") ?? ""),
      typeTag: String(formData.get("typeTag")) as "essay" | "note" | "tutorial",
      topicTags: JSON.parse(String(formData.get("topicTags") ?? "[]")),
      slug: formData.get("slug") ? String(formData.get("slug")) : null,
      status: String(formData.get("status")) as "draft" | "published" | "archived",
    });
    redirect(`/${locale}/admin/writing`);
  }

  async function publish() {
    "use server";
    await publishEssay(id);
    redirect(`/${locale}/admin/writing`);
  }

  async function archive() {
    "use server";
    await archiveEssay(id);
    redirect(`/${locale}/admin/writing`);
  }

  async function remove() {
    "use server";
    await deleteEssay(id);
    redirect(`/${locale}/admin/writing`);
  }

  return (
    <div className="max-w-6xl space-y-6">
      <EssayEditor
        action={save}
        initial={{
          sn: essay.sn,
          title: essay.title,
          deck: essay.deck,
          body: essay.body,
          typeTag: essay.typeTag,
          topicTags: essay.topicTags,
          status: essay.status,
          slug: essay.slug,
          lang: essay.lang,
        }}
      />

      <EssayRevisions essayId={id} revisions={revisions} />

      <div className="flex items-center gap-3 pt-8 border-t border-[var(--color-line)]">
        {essay.status !== "published" && (
          <form action={publish}>
            <button
              type="submit"
              className="bg-[var(--color-accent-2)] text-[var(--color-bg)] px-4 py-2 text-xs uppercase tracking-widest"
            >
              {t("admin.essay.action_publish")}
            </button>
          </form>
        )}
        {essay.status !== "archived" && (
          <form action={archive}>
            <button
              type="submit"
              className="border border-[var(--color-line)] text-[var(--color-ink-mute)] px-4 py-2 text-xs uppercase tracking-widest hover:border-[var(--color-accent)]"
            >
              {t("admin.essay.action_archive")}
            </button>
          </form>
        )}
        <form action={remove} className="ml-auto">
          <button
            type="submit"
            className="text-[var(--color-danger)] text-xs uppercase tracking-widest hover:underline"
          >
            {t("admin.essay.delete")}
          </button>
        </form>
      </div>
    </div>
  );
}

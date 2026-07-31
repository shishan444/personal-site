import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { EssayEditor } from "@/components/admin/essay-editor";
import { createEssay } from "@/lib/actions/essays";

export default async function NewEssayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  async function save(formData: FormData) {
    "use server";
    const sn = String(formData.get("sn") ?? "");
    if (!sn) throw new Error("SN required");
    const result = await createEssay({
      sn,
      lang: String(formData.get("lang") ?? "zh") as "zh" | "en",
      title: String(formData.get("title") ?? ""),
      deck: String(formData.get("deck") ?? ""),
      body: String(formData.get("body") ?? ""),
      typeTag: String(formData.get("typeTag") ?? "essay") as "essay" | "note" | "tutorial",
      topicTags: JSON.parse(String(formData.get("topicTags") ?? "[]")),
      status: String(formData.get("status") ?? "draft") as "draft" | "published" | "archived",
      slug: formData.get("slug") ? String(formData.get("slug")) : null,
    });
    redirect(`/zh/admin/writing/${result.id}`);
  }

  return (
    <div className="max-w-6xl">
      <EssayEditor
        action={save}
        initial={{
          sn: `SN-${Math.floor(Math.random() * 900) + 100}`,
          title: "",
          deck: "",
          body: "",
          typeTag: "essay",
          topicTags: [],
          status: "draft",
          slug: "",
          lang: locale === "en" ? "en" : "zh",
        }}
        isNew
      />
    </div>
  );
}

import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { AgentEditor } from "@/components/admin/agent-editor";
import { createAgent } from "@/lib/actions/agents";

export default async function NewAgentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  async function save(formData: FormData) {
    "use server";
    const specs = JSON.parse(String(formData.get("specs") ?? "[]"));
    const result = await createAgent({
      sn: String(formData.get("sn") ?? "") || undefined,
      name: String(formData.get("name") ?? ""),
      desc: String(formData.get("desc") ?? ""),
      longDesc: formData.get("longDesc") ? String(formData.get("longDesc")) : null,
      status: String(formData.get("status")) as "active" | "beta" | "archived" | "coming",
      specs,
      clickTarget: String(formData.get("clickTarget")) as "internal" | "external",
      launchType: String(formData.get("launchType")) as "external" | "iframe" | "modal",
      launchUrl: formData.get("launchUrl") ? String(formData.get("launchUrl")) : null,
    });
    redirect(`/${locale}/admin/agents/${result.id}`);
  }

  return (
    <div className="max-w-6xl">
      <AgentEditor
        action={save}
        initial={{
          sn: "", // 留空由服务端按 max+1 生成
          name: "",
          desc: "",
          longDesc: null,
          status: "coming",
          specs: [],
          clickTarget: "internal",
          launchType: "external",
          launchUrl: null,
          modalSize: null,
        }}
        isNew
      />
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { AgentEditor } from "@/components/admin/agent-editor";
import { deleteAgent, updateAgent } from "@/lib/actions/agents";
import { getAgentForEdit } from "@/lib/queries/admin-list";

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const agent = await getAgentForEdit(id);
  if (!agent) notFound();

  async function save(formData: FormData) {
    "use server";
    const specs = JSON.parse(String(formData.get("specs") ?? "[]"));
    await updateAgent(id, {
      sn: String(formData.get("sn") ?? ""),
      name: String(formData.get("name") ?? ""),
      desc: String(formData.get("desc") ?? ""),
      longDesc: formData.get("longDesc") ? String(formData.get("longDesc")) : null,
      status: String(formData.get("status")) as "active" | "beta" | "archived" | "coming",
      specs,
      clickTarget: String(formData.get("clickTarget")) as "internal" | "external",
      launchType: String(formData.get("launchType")) as "external" | "iframe" | "modal",
      launchUrl: formData.get("launchUrl") ? String(formData.get("launchUrl")) : null,
    });
    redirect(`/${locale}/admin/agents`);
  }

  async function remove() {
    "use server";
    await deleteAgent(id);
    redirect(`/${locale}/admin/agents`);
  }

  return (
    <div className="max-w-6xl space-y-6">
      <AgentEditor
        action={save}
        initial={{
          sn: agent.sn,
          name: agent.name,
          desc: agent.desc,
          longDesc: agent.longDesc,
          status: agent.status,
          specs: agent.specs,
          clickTarget: agent.clickTarget,
          launchType: agent.launchType,
          launchUrl: agent.launchUrl,
          modalSize: agent.modalSize,
        }}
      />

      <div className="pt-8 border-t border-[var(--color-line)]">
        <form action={remove}>
          <button
            type="submit"
            className="text-[var(--color-danger)] text-xs uppercase tracking-widest hover:underline"
          >
            ✕ Delete Agent
          </button>
        </form>
      </div>
    </div>
  );
}

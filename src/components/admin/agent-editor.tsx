"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { FormField, TextareaField } from "@/components/ui";
import { Button } from "@/components/ui/button";
import type { AgentSpec } from "@/lib/db/schema/agents";

export interface AgentEditorInitial {
  sn: string;
  name: string;
  desc: string;
  longDesc: string | null;
  status: "active" | "beta" | "archived" | "coming";
  specs: AgentSpec[];
  clickTarget: "internal" | "external";
  launchType: "external" | "iframe" | "modal";
  launchUrl: string | null;
  modalSize: "small" | "medium" | "large" | "full" | null;
}

export interface AgentEditorProps {
  action: (formData: FormData) => Promise<void>;
  initial: AgentEditorInitial;
  isNew?: boolean;
}

export function AgentEditor({ action, initial, isNew }: AgentEditorProps) {
  const [state, formAction] = useFormState<void, FormData>(async (_prev, formData) => {
    await action(formData);
  }, undefined);
  const [specs, setSpecs] = useState<AgentSpec[]>(initial.specs);

  const addSpec = () => {
    setSpecs((s) => [
      ...s,
      { id: `spec-${Date.now()}`, label: "", value: "", isPrimary: s.length === 0 },
    ]);
  };

  const updateSpec = (id: string, patch: Partial<AgentSpec>) => {
    setSpecs((s) =>
      patch.isPrimary
        ? s.map((sp) => (sp.id === id ? { ...sp, ...patch } : { ...sp, isPrimary: false }))
        : s.map((sp) => (sp.id === id ? { ...sp, ...patch } : sp)),
    );
  };

  const removeSpec = (id: string) => {
    setSpecs((s) => s.filter((sp) => sp.id !== id));
  };

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <FormField id="sn" name="sn" label="SN" defaultValue={initial.sn} required />
            <FormField
              id="name"
              name="name"
              label="Name (supports <em>)"
              defaultValue={initial.name}
              required
            />
          </div>

          <TextareaField
            id="desc"
            name="desc"
            label="Desc"
            defaultValue={initial.desc}
            rows={2}
            required
          />

          <TextareaField
            id="longDesc"
            name="longDesc"
            label="Long Desc (Markdown)"
            defaultValue={initial.longDesc ?? ""}
            rows={6}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Specs ({specs.length})
              </label>
              <button
                type="button"
                onClick={addSpec}
                className="text-xs text-[var(--color-accent)] hover:underline"
              >
                + Add Spec
              </button>
            </div>
            <div className="space-y-2">
              {specs.map((spec) => (
                <div
                  key={spec.id}
                  className="grid grid-cols-[40px_120px_1fr_80px_32px] gap-2 items-center"
                >
                  <input
                    type="checkbox"
                    checked={spec.isPrimary}
                    onChange={(e) => updateSpec(spec.id, { isPrimary: e.target.checked })}
                    title="isPrimary"
                    className="accent-[var(--color-accent)]"
                  />
                  <input
                    value={spec.label}
                    onChange={(e) => updateSpec(spec.id, { label: e.target.value })}
                    placeholder="LABEL"
                    className="bg-transparent border border-[var(--color-line)] px-2 py-1 text-xs uppercase tracking-widest text-[var(--color-ink)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  />
                  <input
                    value={spec.value}
                    onChange={(e) => updateSpec(spec.id, { value: e.target.value })}
                    placeholder="value"
                    className="bg-transparent border border-[var(--color-line)] px-2 py-1 text-sm text-[var(--color-ink)]"
                  />
                  <input type="hidden" name={`spec-${spec.id}`} value={JSON.stringify(spec)} />
                  <button
                    type="button"
                    onClick={() => removeSpec(spec.id)}
                    className="text-[var(--color-ink-soft)] hover:text-[var(--color-danger)]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {specs.length === 0 && (
                <p
                  className="text-[10px] text-[var(--color-ink-soft)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  No specs. Click "+ Add Spec" to create.
                </p>
              )}
            </div>
            <input type="hidden" name="specs" value={JSON.stringify(specs)} />
          </div>
        </div>

        <aside className="space-y-4 border-l border-[var(--color-line)] pl-6">
          <div>
            <label
              className="block text-xs uppercase tracking-widest text-[var(--color-ink-soft)] mb-1.5"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Status
            </label>
            <select
              name="status"
              defaultValue={initial.status}
              className="w-full bg-transparent border border-[var(--color-line)] px-3 py-2 text-[var(--color-ink)]"
            >
              <option value="active">Active</option>
              <option value="beta">Beta</option>
              <option value="coming">Coming</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label
              className="block text-xs uppercase tracking-widest text-[var(--color-ink-soft)] mb-1.5"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Click Target
            </label>
            <select
              name="clickTarget"
              defaultValue={initial.clickTarget}
              className="w-full bg-transparent border border-[var(--color-line)] px-3 py-2 text-[var(--color-ink)]"
            >
              <option value="internal">Internal (detail page)</option>
              <option value="external">External (URL)</option>
            </select>
          </div>

          <div>
            <label
              className="block text-xs uppercase tracking-widest text-[var(--color-ink-soft)] mb-1.5"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Launch Type
            </label>
            <select
              name="launchType"
              defaultValue={initial.launchType}
              className="w-full bg-transparent border border-[var(--color-line)] px-3 py-2 text-[var(--color-ink)]"
            >
              <option value="external">External</option>
              <option value="iframe">iframe</option>
              <option value="modal">Modal</option>
            </select>
          </div>

          <FormField
            id="launchUrl"
            name="launchUrl"
            label="Launch URL"
            defaultValue={initial.launchUrl ?? ""}
          />

          <SubmitButton isNew={isNew} />
        </aside>
      </div>
      {state !== undefined && <div className="text-xs text-[var(--color-accent-2)]">✓ Saved</div>}
    </form>
  );
}

function SubmitButton({ isNew }: { isNew?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving…" : isNew ? "Create" : "Save"}
    </Button>
  );
}

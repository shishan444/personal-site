"use client";

import { useFormState, useFormStatus } from "react-dom";
import { FormField, TextareaField } from "@/components/ui";
import { Button } from "@/components/ui/button";

interface FormProps {
  action: (formData: FormData) => Promise<void>;
  initial: {
    siteName: string;
    subtitle: string;
    currentVersion: string;
    currentCalibre: string;
    heroSub: string;
    rdMeta1: string;
    rdMeta2: string;
    theme: string;
  };
}

export function SiteConfigForm({ action, initial }: FormProps) {
  const [, formAction] = useFormState<void, FormData>(async (_p, fd) => {
    await action(fd);
  }, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="siteName"
          name="siteName"
          label="Site Name"
          defaultValue={initial.siteName}
          required
        />
        <FormField id="subtitle" name="subtitle" label="Subtitle" defaultValue={initial.subtitle} />
        <FormField
          id="currentVersion"
          name="currentVersion"
          label="Current Version"
          defaultValue={initial.currentVersion}
        />
        <FormField
          id="currentCalibre"
          name="currentCalibre"
          label="Current Calibre"
          defaultValue={initial.currentCalibre}
        />
        <FormField id="theme" name="theme" label="Theme" defaultValue={initial.theme} />
      </div>

      <TextareaField
        id="heroSub"
        name="heroSub"
        label="Hero Sub"
        defaultValue={initial.heroSub}
        rows={3}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField id="rdMeta1" name="rdMeta1" label="RD Meta 1" defaultValue={initial.rdMeta1} />
        <FormField id="rdMeta2" name="rdMeta2" label="RD Meta 2" defaultValue={initial.rdMeta2} />
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save Settings"}
    </Button>
  );
}

"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations();
  const [, formAction] = useFormState<void, FormData>(async (_p, fd) => {
    await action(fd);
  }, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="siteName"
          name="siteName"
          label={t("admin.settings_form.field.site_name")}
          defaultValue={initial.siteName}
          required
        />
        <FormField
          id="subtitle"
          name="subtitle"
          label={t("admin.settings_form.field.subtitle")}
          defaultValue={initial.subtitle}
        />
        <FormField
          id="currentVersion"
          name="currentVersion"
          label={t("admin.settings_form.field.current_version")}
          defaultValue={initial.currentVersion}
        />
        <FormField
          id="currentCalibre"
          name="currentCalibre"
          label={t("admin.settings_form.field.current_calibre")}
          defaultValue={initial.currentCalibre}
        />
        <FormField
          id="theme"
          name="theme"
          label={t("admin.settings_form.field.theme")}
          defaultValue={initial.theme}
        />
      </div>

      <TextareaField
        id="heroSub"
        name="heroSub"
        label={t("admin.settings_form.field.hero_sub")}
        defaultValue={initial.heroSub}
        rows={3}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="rdMeta1"
          name="rdMeta1"
          label={t("admin.settings_form.field.rd_meta1")}
          defaultValue={initial.rdMeta1}
        />
        <FormField
          id="rdMeta2"
          name="rdMeta2"
          label={t("admin.settings_form.field.rd_meta2")}
          defaultValue={initial.rdMeta2}
        />
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const t = useTranslations();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("admin.common.saving") : t("admin.settings_form.save")}
    </Button>
  );
}

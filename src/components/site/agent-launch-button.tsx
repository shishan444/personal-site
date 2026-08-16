"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MODAL_MAX_WIDTH: Record<string, string> = {
  small: "max-w-[480px]",
  medium: "max-w-[640px]",
  large: "max-w-[960px]",
  full: "max-w-[90vw]",
};

/**
 * DEPLOY 三态启动（审计 #13：launchType 字段此前形同虚设，一律外跳）。
 * external → 新窗口外链；iframe → /agents/[sn]/use 全页嵌入；modal → 站内弹窗嵌入（modalSize 控宽）。
 */
export function AgentLaunchButton({
  sn,
  name,
  launchType,
  launchUrl,
  modalSize,
  locale,
}: {
  sn: string;
  name: string;
  launchType: "external" | "iframe" | "modal";
  launchUrl: string | null;
  modalSize: string | null;
  locale: string;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  if (!launchUrl) return null;

  if (launchType === "modal") {
    const widthClass = MODAL_MAX_WIDTH[modalSize ?? "medium"] ?? MODAL_MAX_WIDTH.medium;
    return (
      <>
        <Button className="w-full mt-4" onClick={() => setOpen(true)}>
          {t("agent.button_deploy")}
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className={`${widthClass} w-full`}>
            <DialogHeader>
              <DialogTitle>{name}</DialogTitle>
              <DialogDescription>{launchUrl}</DialogDescription>
            </DialogHeader>
            <div className="w-full h-[70vh] border border-[var(--color-line)]">
              <iframe
                src={launchUrl}
                title={name}
                className="w-full h-full"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (launchType === "iframe") {
    return (
      <Button asChild className="w-full mt-4">
        <a href={`/${locale}/agents/${sn}/use`}>{t("agent.button_deploy")}</a>
      </Button>
    );
  }

  return (
    <Button asChild className="w-full mt-4">
      <a href={launchUrl} target="_blank" rel="noreferrer">
        {t("agent.button_deploy")}
      </a>
    </Button>
  );
}

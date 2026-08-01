import type { Locator, Page } from "@playwright/test";
import { E2E_OWNER } from "../../playwright.config";

export const AUTH_STATE = "tests/e2e-pw/.auth/state.json";

export async function loginWithPassword(page: Page, password: string): Promise<void> {
  await page.goto("/zh/login");
  await page.getByLabel(/邮箱|EMAIL/i).fill(E2E_OWNER.email);
  await page.getByLabel(/密码|PASSWORD/i).fill(password);
  await page.getByRole("button", { name: /登录|SIGN IN/i }).click();
}

// Playwright 的 dragTo 不触发 HTML5 原生 DnD 事件序列，
// 需在页面上下文手工构造 DataTransfer 并分发 dragstart/dragover/drop/dragend。
export async function html5DragTo(source: Locator, target: Locator): Promise<void> {
  await source.evaluate(
    async (srcEl, targetEl) => {
      const dataTransfer = new DataTransfer();
      const tick = () => new Promise((r) => setTimeout(r, 20));
      srcEl.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer }));
      await tick();
      targetEl.dispatchEvent(
        new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer }),
      );
      await tick();
      targetEl.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer }));
      await tick();
      srcEl.dispatchEvent(new DragEvent("dragend", { bubbles: true, dataTransfer }));
    },
    await target.elementHandle(),
  );
}

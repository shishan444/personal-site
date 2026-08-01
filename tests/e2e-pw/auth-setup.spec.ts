import { expect, test } from "@playwright/test";
import { E2E_OWNER } from "../../playwright.config";
import { AUTH_STATE, loginWithPassword } from "./helpers";

test("authenticate · 首次改密后保存会话", async ({ page }) => {
  // 已改密的数据库：直接用 E2E 密码登录
  await loginWithPassword(page, E2E_OWNER.password);
  await page.waitForLoadState("networkidle");

  if (page.url().includes("/login")) {
    // 全新数据库：种子密码登录 → 强制改密
    await loginWithPassword(page, E2E_OWNER.seedPassword);
    await expect(page).toHaveURL(/\/zh\/change-password/);
    await page.getByLabel(/当前密码/i).fill(E2E_OWNER.seedPassword);
    await page
      .getByLabel(/新密码/i)
      .first()
      .fill(E2E_OWNER.password);
    await page.getByLabel(/确认新密码/i).fill(E2E_OWNER.password);
    await page.getByRole("button", { name: /设置新密码/ }).click();
  }

  await expect(page).toHaveURL(/\/zh\/admin/);
  await expect(page.getByText(E2E_OWNER.email)).toBeVisible();
  await page.context().storageState({ path: AUTH_STATE });
});

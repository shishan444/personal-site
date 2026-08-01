import { expect, test } from "@playwright/test";
import { E2E_OWNER } from "../../playwright.config";
import { loginWithPassword } from "./helpers";

test("B11 · 登录 / 退出 / 权限", async ({ page }) => {
  // 无会话访问 admin → 重定向登录页
  await page.goto("/zh/admin");
  await expect(page).toHaveURL(/\/zh\/login\?from=/);

  // 登录成功 → 进入仪表盘
  await loginWithPassword(page, E2E_OWNER.password);
  await expect(page).toHaveURL(/\/zh\/admin/);
  await expect(page.getByText(E2E_OWNER.email)).toBeVisible();

  // 退出 → 回到登录页，admin 不再可访问
  await page.getByRole("button", { name: /退出登录|SIGN OUT/i }).click();
  await expect(page).toHaveURL(/\/zh\/login/);
  await page.goto("/zh/admin");
  await expect(page).toHaveURL(/\/zh\/login\?from=/);
});

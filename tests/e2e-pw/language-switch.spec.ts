import { expect, test } from "@playwright/test";

test("B7 · 中英切换", async ({ page }) => {
  await page.goto("/zh");
  await expect(page.getByRole("button", { name: /中 ▾/ })).toBeVisible();

  // 切换到英文
  await page.getByRole("button", { name: /中 ▾/ }).click();
  await page.getByRole("button", { name: /^English$/ }).click();
  await expect(page).toHaveURL(/\/en/);
  await expect(page.getByRole("button", { name: /EN ▾/ })).toBeVisible();

  // 刷新后保留（cookie 记忆）
  await page.reload();
  await expect(page.getByRole("button", { name: /EN ▾/ })).toBeVisible();

  // 切回中文
  await page.getByRole("button", { name: /EN ▾/ }).click();
  await page.getByRole("button", { name: /^中文$/ }).click();
  await expect(page).toHaveURL(/\/zh/);
});

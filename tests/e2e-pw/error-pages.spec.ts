import { expect, test } from "@playwright/test";

test("B10 · 404 错误页", async ({ page }) => {
  const res = await page.goto("/zh/no-such-page-e2e");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("找不到页面").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /返回首页|back/i })).toBeVisible();

  const resEn = await page.goto("/en/no-such-page-e2e");
  expect(resEn?.status()).toBe(404);
  await expect(page.getByText("Page not found").first()).toBeVisible();
});

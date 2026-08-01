import { expect, test } from "@playwright/test";
import { AUTH_STATE, html5DragTo } from "./helpers";

test.use({ storageState: AUTH_STATE });

test("B19 · Agent 拖拽排序持久化", async ({ page }) => {
  await page.goto("/zh/admin/agents");
  const rows = page.locator("tbody tr");
  await expect(rows.first()).toBeVisible();

  const firstSn = await rows.nth(0).locator("td").nth(2).innerText();
  const secondSn = await rows.nth(1).locator("td").nth(2).innerText();

  // 拖拽第 2 行到第 1 行位置
  await html5DragTo(rows.nth(1), rows.nth(0));
  await page.waitForLoadState("networkidle");

  // 刷新后顺序保持
  await page.reload();
  const afterFirst = await page.locator("tbody tr").nth(0).locator("td").nth(2).innerText();
  expect(afterFirst).toBe(secondSn);

  // 还原顺序
  await html5DragTo(page.locator("tbody tr").nth(0), page.locator("tbody tr").nth(1));
  await page.waitForLoadState("networkidle");
  await page.reload();
  const restoredFirst = await page.locator("tbody tr").nth(0).locator("td").nth(2).innerText();
  expect(restoredFirst).toBe(firstSn);
});

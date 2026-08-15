import { expect, test } from "@playwright/test";
import { AUTH_STATE } from "./helpers";

// 每次运行使用唯一 SN/slug，避免上轮失败残留触发唯一索引冲突
const RUN = Date.now() % 100000;
const SN = `E2E-${RUN}`;
const TITLE = `E2E 发布流程测试 ${RUN}`;
const SLUG = `e2e-publish-test-${RUN}`;

test.use({ storageState: AUTH_STATE });

test("B1 · 文章发布全流程", async ({ page }) => {
  // 1. 创建草稿（创建后跳转编辑页）
  await page.goto("/zh/admin/writing/new");
  await page.locator("#sn").fill(SN);
  await page.locator("#title").fill(TITLE);
  await page.locator("#deck").fill("E2E 测试 deck");
  await page.locator("[name=body]").fill("## 测试章节\n\nE2E 正文内容。");
  await page.locator("#slug").fill(SLUG);
  await page.getByRole("button", { name: /SAVE|CREATE|保存|创建/i }).click();
  await expect(page).toHaveURL(/\/zh\/admin\/writing\/[0-9a-f-]{36}$/);

  // 2. 回到列表 → 进入编辑页 → 发布
  await page.goto("/zh/admin/writing");
  await page.getByRole("link", { name: TITLE }).click();
  await expect(page).toHaveURL(/\/zh\/admin\/writing\/[0-9a-f-]{36}$/);
  await page.getByRole("button", { name: /✓ 发布|✓ Publish/i }).click();
  await expect(page).toHaveURL(/\/zh\/admin\/writing$/);

  // 3. 前台可见
  await page.goto(`/zh/writing/${SLUG}`);
  await expect(page.getByRole("heading", { name: new RegExp(TITLE) })).toBeVisible();

  // 4. 清理：删除
  await page.goto("/zh/admin/writing");
  await page.getByRole("link", { name: TITLE }).click();
  await page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /✕ 删除|✕ Delete/i }).click();
  await expect(page).toHaveURL(/\/zh\/admin\/writing$/);

  // 5. 前台不可见（404）
  const res = await page.goto(`/zh/writing/${SLUG}`);
  expect(res?.status()).toBe(404);
});

import { expect, test } from "@playwright/test";
import { AUTH_STATE } from "./helpers";

// 每次运行使用唯一 SN，避免上轮失败残留触发唯一索引冲突
const RUN = Date.now() % 100000;
const SN = `E2E-A-${RUN}`;
const NAME = `E2E Flow Agent ${RUN}`;

test.use({ storageState: AUTH_STATE });

test("B2 · Agent 上线全流程", async ({ page }) => {
  // 1. 创建（coming 状态，创建后跳转编辑页）
  await page.goto("/zh/admin/agents/new");
  await page.locator("#sn").fill(SN);
  await page.locator("#name").fill(NAME);
  await page.locator("[name=desc]").fill("E2E 测试 Agent 描述");
  await page.locator("[name=status]").selectOption("coming");
  await page.getByRole("button", { name: /SAVE|CREATE/i }).click();
  await expect(page).toHaveURL(/\/zh\/admin\/agents\/[0-9a-f-]{36}$/);

  // 2. 回到列表 → 编辑 → 设为 active
  await page.goto("/zh/admin/agents");
  await page.getByRole("link", { name: NAME }).click();
  await page.locator("[name=status]").selectOption("active");
  await page.getByRole("button", { name: /SAVE|CREATE/i }).click();
  await expect(page).toHaveURL(/\/zh\/admin\/agents$/);

  // 3. 前台详情页可见
  await page.goto(`/zh/agents/${SN}`);
  await expect(page.getByRole("heading", { name: new RegExp(NAME) })).toBeVisible();

  // 4. 清理
  await page.goto("/zh/admin/agents");
  await page.getByRole("link", { name: NAME }).click();
  await page.getByRole("button", { name: /✕ Delete Agent/i }).click();
  await expect(page).toHaveURL(/\/zh\/admin\/agents$/);

  const res = await page.goto(`/zh/agents/${SN}`);
  expect(res?.status()).toBe(404);
});

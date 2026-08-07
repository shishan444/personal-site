import { expect, test } from "@playwright/test";
import { AUTH_STATE, html5DragTo } from "./helpers";

// 每次运行使用唯一 SN，避免上轮失败残留触发唯一索引冲突
const RUN = Date.now() % 100000;
const SN = `E2E-S-${RUN}`;
const NAME = `E2E Shots Agent ${RUN}`;

test.use({ storageState: AUTH_STATE });

test("B20 · Agent 截图上传 / 拖拽排序 / 移除", async ({ page }) => {
  // 0. 创建专用 Agent
  await page.goto("/zh/admin/agents/new");
  await page.locator("#sn").fill(SN);
  await page.locator("#name").fill(NAME);
  await page.locator("[name=desc]").fill("截图管理 E2E 测试");
  await page.locator("[name=status]").selectOption("active");
  await page.getByRole("button", { name: /SAVE|CREATE|保存|创建/i }).click();
  await expect(page).toHaveURL(/\/zh\/admin\/agents\/[0-9a-f-]{36}$/);

  // 1. 上传两张截图
  const fileInput = page.locator("input[type=file]");
  await fileInput.setInputFiles("tests/fixtures/e2e-shot-1.png");
  await expect(page.getByText("已上传并绑定")).toBeVisible();
  await fileInput.setInputFiles("tests/fixtures/e2e-shot-2.png");
  await expect(page.getByText("详情页截图 · 2")).toBeVisible();

  const captions = () => page.locator("ul li span[title]");
  await expect(captions()).toHaveCount(2);
  const firstCaption = await captions().nth(0).innerText();

  // 2. 拖拽第 2 张到第 1 张位置 → 刷新后顺序保持
  await html5DragTo(page.locator("ul li").nth(1), page.locator("ul li").nth(0));
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(page.getByText("详情页截图 · 2")).toBeVisible();
  const afterFirst = await captions().nth(0).innerText();
  expect(afterFirst).not.toBe(firstCaption);

  // 3. 移除一张（confirm 自动接受）
  page.on("dialog", (d) => void d.accept());
  await page.locator("ul li button", { hasText: "✕" }).first().click();
  await expect(page.getByText("详情页截图 · 1")).toBeVisible();

  // 4. 清理：删除 Agent
  await page.goto("/zh/admin/agents");
  await page.getByRole("link", { name: NAME }).click();
  await page.getByRole("button", { name: /Delete Agent|删除 Agent/i }).click();
  await expect(page).toHaveURL(/\/zh\/admin\/agents$/);
});

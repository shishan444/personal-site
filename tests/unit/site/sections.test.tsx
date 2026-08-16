import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { AgentsSection } from "@/components/site/sections/agents-section";
import { HeroSection } from "@/components/site/sections/hero-section";
import { OutroSection } from "@/components/site/sections/outro-section";
import { TimelineSection } from "@/components/site/sections/timeline-section";
import { WritingSection } from "@/components/site/sections/writing-section";
import type { HomeAgent, HomeEssay, HomeTimelineNode } from "@/lib/queries/site";
import zhMessages from "@/messages/zh.json";

function IntlWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="zh" messages={zhMessages}>
      {children}
    </NextIntlClientProvider>
  );
}

const mockEssay: HomeEssay = {
  id: "e1",
  sn: "SN-001",
  title: "Test <em>Essay</em>",
  deck: "deck text",
  typeTag: "essay",
  topicTags: ["AI"],
  publishedAt: new Date("2026-07-15"),
  slug: "test",
  words: 100,
  readMinutes: 1,
  ogImageUrl: null,
};

const mockAgent: HomeAgent = {
  id: "a1",
  sn: "CAL.A-01",
  name: "Test <em>Agent</em>",
  desc: "agent desc",
  status: "active",
  specs: [{ id: "s1", label: "FREQ", value: "28800", isPrimary: true }],
  launchType: "external",
  launchUrl: "https://example.com",
  order: 1,
};

const mockTimelineNode: HomeTimelineNode = {
  id: "t1",
  version: "v0.4",
  name: "Test <em>Node</em>",
  desc: "node desc",
  type: "now",
  date: "2026-07-29",
  changes: [{ id: "c1", type: "add", text: "Added X" }],
  filesChanged: 10,
  linesAdd: 100,
  linesDel: 5,
  isNow: true,
};

describe("L1 · HeroSection", () => {
  it("F1 · 渲染章节 id=01 + 关键文案", () => {
    const { container } = render(
      <IntlWrapper>
        <HeroSection
          stats={{ agentsActive: 2, agentsBeta: 1, essaysPublished: 5, currentCalibre: "04" }}
        />
      </IntlWrapper>,
    );
    const section = container.querySelector('[id="01"]');
    expect(section).toBeTruthy();
    expect(screen.getAllByText(/AI Agent/i).length).toBeGreaterThan(0);
  });

  it("F2 · meta 数据含 active 数", () => {
    render(
      <IntlWrapper>
        <HeroSection
          stats={{ agentsActive: 3, agentsBeta: 1, essaysPublished: 5, currentCalibre: "04" }}
        />
      </IntlWrapper>,
    );
    expect(screen.getByText(/3 个在用/)).toBeTruthy();
  });
});

describe("L1 · WritingSection", () => {
  it("F1 · 渲染所有 essays 在 TOC（改版后按标题，剔除 SN/日期/分钟列）", () => {
    render(
      <IntlWrapper>
        <WritingSection
          essays={[mockEssay, { ...mockEssay, id: "e2", sn: "SN-002", title: "Second" }]}
        />
      </IntlWrapper>,
    );
    expect(screen.getByText("Test Essay")).toBeTruthy();
    expect(screen.getByText("Second")).toBeTruthy();
  });

  it("F2 · 初始 active 显示第一篇 deck", () => {
    render(
      <IntlWrapper>
        <WritingSection
          essays={[
            mockEssay,
            { ...mockEssay, id: "e2", sn: "SN-002", title: "Second", deck: "second deck" },
          ]}
        />
      </IntlWrapper>,
    );
    expect(screen.getByText("deck text")).toBeTruthy();
  });

  it("F3 · 摘要卡 meta 行含日期/类型标签/时长", () => {
    render(
      <IntlWrapper>
        <WritingSection essays={[mockEssay]} />
      </IntlWrapper>,
    );
    // meta 行由多个 JSX 表达式组成，函数 matcher 合并判断
    const metas = screen.getAllByText((_, el) => {
      const text = el?.textContent ?? "";
      return (
        el?.tagName === "DIV" &&
        text.includes("2026.07") &&
        text.includes("观点") &&
        text.includes("1 min")
      );
    });
    expect(metas.length).toBeGreaterThan(0);
  });

  it("F6 · 摘要卡渲染查看原文链接（新标签页指向详情页）", () => {
    render(
      <IntlWrapper>
        <WritingSection essays={[mockEssay]} />
      </IntlWrapper>,
    );
    const link = screen.getByText(/查看原文/).closest("a");
    expect(link).toBeTruthy();
    expect(link?.getAttribute("href")).toContain("/writing/test");
    expect(link?.getAttribute("target")).toBe("_blank");
  });

  it("F7 · 有 OG 图时渲染配图，无图时 SN 占位", () => {
    const { rerender } = render(
      <IntlWrapper>
        <WritingSection essays={[{ ...mockEssay, ogImageUrl: "/uploads/2026/08/og.png" }]} />
      </IntlWrapper>,
    );
    expect(document.querySelector('img[src*="og.png"]')).toBeTruthy();

    rerender(
      <IntlWrapper>
        <WritingSection essays={[mockEssay]} />
      </IntlWrapper>,
    );
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByText("SN-001")).toBeTruthy();
  });

  it("F4 · section 不在视口中央时方向键不切换文章", () => {
    render(
      <IntlWrapper>
        <WritingSection
          essays={[
            mockEssay,
            { ...mockEssay, id: "e2", sn: "SN-002", title: "Second", deck: "second deck" },
          ]}
        />
      </IntlWrapper>,
    );
    const section = document.getElementById("02") as HTMLElement;
    // jsdom 默认 rect 全 0（bottom=0 不大于半视口），本就处于「不可见」分支；
    // 显式 mock 一个完全在视口下方的 rect 使语义清晰
    const spy = vi.spyOn(section, "getBoundingClientRect").mockReturnValue({
      top: 2000,
      bottom: 3000,
      height: 1000,
      left: 0,
      right: 1000,
      width: 1000,
      x: 0,
      y: 2000,
      toJSON: () => ({}),
    } as DOMRect);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.queryByText("second deck")).toBeNull();
    spy.mockRestore();
  });

  it("F5 · 焦点在输入框时方向键不切换文章", () => {
    render(
      <div>
        <input data-testid="box" />
        <IntlWrapper>
          <WritingSection
            essays={[
              mockEssay,
              { ...mockEssay, id: "e2", sn: "SN-002", title: "Second", deck: "second deck" },
            ]}
          />
        </IntlWrapper>
      </div>,
    );
    fireEvent.keyDown(screen.getByTestId("box"), { key: "ArrowRight" });
    expect(screen.queryByText("second deck")).toBeNull();
  });
});

describe("L1 · AgentsSection", () => {
  it("F1 · 渲染所有 agents 卡片", () => {
    render(
      <IntlWrapper>
        <AgentsSection agents={[mockAgent]} />
      </IntlWrapper>,
    );
    expect(screen.getAllByText("CAL.A-01").length).toBeGreaterThan(0);
  });

  it("F2 · coming 状态不渲染 Launch 按钮", () => {
    render(
      <IntlWrapper>
        <AgentsSection agents={[{ ...mockAgent, status: "coming", launchUrl: null }]} />
      </IntlWrapper>,
    );
    expect(screen.queryByText("开始使用")).toBeNull();
  });

  it("F3 · 滚动驱动离散反算（progress → floor×N → 选中卡对齐偏移）", async () => {
    const agents = ["a1", "a2", "a3", "a4"].map((id, i) => ({
      ...mockAgent,
      id,
      name: `Agent ${i + 1}`,
    }));
    render(
      <IntlWrapper>
        <AgentsSection agents={agents} />
      </IntlWrapper>,
    );
    // 占位容器（pinRef）：N×67vh 高度块；jsdom 无布局，mock rect 模拟滚到底
    const pin = document.querySelector(".relative") as HTMLElement;
    vi.spyOn(pin, "getBoundingClientRect").mockReturnValue({
      top: -900,
      bottom: 100,
      height: 1000,
      left: 0,
      right: 1000,
      width: 1000,
      x: 0,
      y: -900,
      toJSON: () => ({}),
    } as DOMRect);
    Object.defineProperty(window, "innerHeight", { value: 400, configurable: true });
    // 卡片几何：第 0 张自然位 40px（pl-10），步进 472px（440 卡宽 + 32 gap）
    const cards = document.querySelectorAll("article");
    cards.forEach((c, i) => {
      Object.defineProperty(c, "offsetLeft", { value: 40 + i * 472, configurable: true });
    });

    fireEvent.scroll(window);
    // progress = 900/600 → clamp 1 → floor(1×4)=3（第 4 张）；offset = 40 − (40+3×472) = −1416
    const track = document.querySelector(".will-change-transform") as HTMLElement;
    await vi.waitFor(() => {
      expect(screen.getByText(/4\/4/)).toBeTruthy();
      expect(track.style.transform).toContain("-1416px");
    });
  });

  it("F4 · 点击第 2 张卡 → 选中态迁移 + 滚动落点为段中央（idx+0.5×per）", async () => {
    const agents = ["a1", "a2", "a3", "a4"].map((id, i) => ({
      ...mockAgent,
      id,
      name: `Agent ${i + 1}`,
    }));
    render(
      <IntlWrapper>
        <AgentsSection agents={agents} />
      </IntlWrapper>,
    );
    // 稳态几何：progress=150/600=0.25 → floor(×4)=1，与点击目标一致（rAF 重算不打架）
    mockAgentGeometry({ top: -150, height: 1000, scrollY: 150, viewport: 400 });
    const scrollCalls: number[] = [];
    vi.spyOn(window, "scrollTo").mockImplementation(((opt: { top?: number }) => {
      if (typeof opt?.top === "number") scrollCalls.push(opt.top);
    }) as never);

    const cards = document.querySelectorAll("article");
    expect(cards[0].className).toContain("glow-accent");
    fireEvent.click(screen.getByText("Agent 2"));
    // per = (1000−400)/4 = 150；top+scrollY = −150+150 = 0；落点 = 0 + 150×(1+0.5) = 225
    expect(scrollCalls).toEqual([225]);
    await vi.waitFor(() => {
      expect(cards[1].className).toContain("glow-accent");
      expect(cards[0].className).not.toContain("glow-accent");
    });
    vi.spyOn(window, "scrollTo").mockRestore();
  });

  it("F5 · 点击卡片内部按钮/链接不触发选卡", () => {
    const agents = ["a1", "a2"].map((id, i) => ({ ...mockAgent, id, name: `Agent ${i + 1}` }));
    render(
      <IntlWrapper>
        <AgentsSection agents={agents} />
      </IntlWrapper>,
    );
    mockAgentGeometry({ top: 0, height: 1000, scrollY: 0, viewport: 400 });
    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation((() => {}) as never);

    // 卡片内第一个真按钮（手记 outline Button）
    const innerButton = document.querySelector("article button") as HTMLElement;
    fireEvent.click(innerButton);
    expect(scrollSpy).not.toHaveBeenCalled();
    expect(document.querySelectorAll("article")[0].className).toContain("glow-accent");
    scrollSpy.mockRestore();
  });

  it("F6 · 卡片区滚轮向下 → 拦截默认滚动并翻到下一张", async () => {
    const agents = ["a1", "a2", "a3"].map((id, i) => ({
      ...mockAgent,
      id,
      name: `Agent ${i + 1}`,
    }));
    render(
      <IntlWrapper>
        <AgentsSection agents={agents} />
      </IntlWrapper>,
    );
    // 稳态几何：progress=0.25 → idx 1，与滚轮目标一致
    mockAgentGeometry({ top: -150, height: 1000, scrollY: 150, viewport: 400 });
    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation((() => {}) as never);
    const track = document.querySelector(".will-change-transform") as HTMLElement;

    const cancelled = !fireEvent.wheel(track, { deltaY: 100 });
    expect(cancelled).toBe(true); // preventDefault 生效（页面不动）
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => {
      expect(document.querySelectorAll("article")[1].className).toContain("glow-accent");
    });
    scrollSpy.mockRestore();
  });

  it("F7 · 边界放行：第一张卡向上滚 → 不拦截、不翻卡", () => {
    render(
      <IntlWrapper>
        <AgentsSection
          agents={["a1", "a2"].map((id, i) => ({ ...mockAgent, id, name: `Agent ${i + 1}` }))}
        />
      </IntlWrapper>,
    );
    mockAgentGeometry({ top: 0, height: 1000, scrollY: 0, viewport: 400 });
    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation((() => {}) as never);
    const track = document.querySelector(".will-change-transform") as HTMLElement;

    const cancelled = !fireEvent.wheel(track, { deltaY: -100 });
    expect(cancelled).toBe(false); // 放行页面滚动
    expect(scrollSpy).not.toHaveBeenCalled();
    expect(document.querySelectorAll("article")[0].className).toContain("glow-accent");
    scrollSpy.mockRestore();
  });

  it("F8 · 手势锁：450ms 窗口内惯性尾流只翻一张", () => {
    render(
      <IntlWrapper>
        <AgentsSection
          agents={["a1", "a2", "a3"].map((id, i) => ({
            ...mockAgent,
            id,
            name: `Agent ${i + 1}`,
          }))}
        />
      </IntlWrapper>,
    );
    // 稳态几何：progress=0.25×3 段 → top=−150 时 progress=150/600=0.25 → floor(×3)=0（初始），首次滚轮 → 1
    mockAgentGeometry({ top: -150, height: 1000, scrollY: 150, viewport: 400 });
    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation((() => {}) as never);
    const track = document.querySelector(".will-change-transform") as HTMLElement;
    const nowSpy = vi.spyOn(performance, "now").mockReturnValue(1000);

    fireEvent.wheel(track, { deltaY: 100 }); // 首个 wheel → 翻卡 + 上锁
    const tailCancelled = !fireEvent.wheel(track, { deltaY: 100 }); // 同时刻尾流
    expect(tailCancelled).toBe(true); // 仍拦截（吞掉尾流防页面中途起滚）
    expect(scrollSpy).toHaveBeenCalledTimes(1); // 但不再翻卡

    nowSpy.mockReturnValue(2000); // 锁过期
    fireEvent.wheel(track, { deltaY: 100 });
    expect(scrollSpy).toHaveBeenCalledTimes(2);
    nowSpy.mockRestore();
    scrollSpy.mockRestore();
  });

  it("F9 · 键盘 ←→：章节在视口时翻卡，落点段中央", () => {
    render(
      <IntlWrapper>
        <AgentsSection
          agents={["a1", "a2", "a3", "a4"].map((id, i) => ({
            ...mockAgent,
            id,
            name: `Agent ${i + 1}`,
          }))}
        />
      </IntlWrapper>,
    );
    mockAgentGeometry({ top: 0, height: 1000, scrollY: 0, viewport: 400 });
    // 键盘守卫读的是 #03 section 自身 rect（jsdom 默认全 0 → bottom=0 不在视口），需单独 mock
    const section = document.getElementById("03") as HTMLElement;
    const sectionSpy = vi
      .spyOn(section, "getBoundingClientRect")
      .mockReturnValue({ top: -400, bottom: 600, height: 1000 } as DOMRect);
    const scrollCalls: number[] = [];
    vi.spyOn(window, "scrollTo").mockImplementation(((opt: { top?: number }) => {
      if (typeof opt?.top === "number") scrollCalls.push(opt.top);
    }) as never);

    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    // per = 600/4 = 150；top+scrollY = 0+0 = 0；落点 150×1.5=225 → 150×0.5=75
    expect(scrollCalls).toEqual([225, 75]);
    sectionSpy.mockRestore();
    vi.spyOn(window, "scrollTo").mockRestore();
  });
});

/** Agents 测试共用几何 mock：pin rect + offsetHeight + 视口/滚动位置。 */
function mockAgentGeometry({
  top,
  height,
  scrollY,
  viewport,
}: {
  top: number;
  height: number;
  scrollY: number;
  viewport: number;
}) {
  const pin = document.querySelector(".relative") as HTMLElement;
  vi.spyOn(pin, "getBoundingClientRect").mockReturnValue({
    top,
    bottom: top + height,
    height,
    left: 0,
    right: 1000,
    width: 1000,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect);
  Object.defineProperty(pin, "offsetHeight", { value: height, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: viewport, configurable: true });
  Object.defineProperty(window, "scrollY", { value: scrollY, configurable: true });
}

describe("L1 · TimelineSection", () => {
  it("F1 · 渲染 SVG timeline + 节点 circle", () => {
    const { container } = render(
      <IntlWrapper>
        <TimelineSection nodes={[mockTimelineNode]} />
      </IntlWrapper>,
    );
    expect(container.querySelector("svg")).toBeTruthy();
    expect(container.querySelectorAll("circle").length).toBeGreaterThan(0);
  });

  it("F2 · 节点变化渲染 change list", () => {
    render(
      <IntlWrapper>
        <TimelineSection nodes={[mockTimelineNode]} />
      </IntlWrapper>,
    );
    expect(screen.getByText("Added X")).toBeTruthy();
  });
});

describe("L1 · OutroSection", () => {
  it("F1 · 渲染 outro 章节标题", () => {
    const { container } = render(
      <IntlWrapper>
        <OutroSection />
      </IntlWrapper>,
    );
    expect(container.querySelector('[id="05"]')).toBeTruthy();
  });
});

describe("L1 · WritingSection 点击落点（错位修复回归）", () => {
  it("F8 · 目录点击滚动目标为条目区间中央（idx+0.5×per），亚像素偏差不掉档", async () => {
    const essays = ["e1", "e2", "e3", "e4", "e5"].map((id, i) => ({
      ...mockEssay,
      id,
      sn: `SN-00${i + 1}`,
      title: `Essay ${i + 1}`,
      deck: `deck ${i + 1}`,
    }));
    render(
      <IntlWrapper>
        <WritingSection essays={essays} />
      </IntlWrapper>,
    );
    // mock 几何：pin 占位 1000px，视口 400px → scrollable=600，per=120
    const pin = document.querySelector(".relative") as HTMLElement;
    vi.spyOn(pin, "getBoundingClientRect").mockReturnValue({
      top: -600,
      bottom: 400,
      height: 1000,
      left: 0,
      right: 1000,
      width: 1000,
      x: 0,
      y: -600,
      toJSON: () => ({}),
    } as DOMRect);
    Object.defineProperty(pin, "offsetHeight", { value: 1000, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 400, configurable: true });
    Object.defineProperty(window, "scrollY", { value: 600, configurable: true });
    const scrollCalls: number[] = [];
    vi.spyOn(window, "scrollTo").mockImplementation(((opt: { top?: number }) => {
      if (typeof opt?.top === "number") scrollCalls.push(opt.top);
    }) as never);

    // 点击第二篇（idx=1）
    fireEvent.click(screen.getByText("Essay 2"));
    expect(scrollCalls.length).toBe(1);
    // 目标 = (top+scrollY)=0 + per*(1+0.5) = 180（中央落点；边界落法为 120）
    expect(scrollCalls[0]).toBe(180);

    // 反算验证：落点对应 pin.top=-180，progress=180/600=0.3；亚像素 +0.9px → 0.3015 或 -0.9px → 0.2985，floor(×5) 均为 1 ✓ 不掉档
    const progressWithSubpixelError = (180 - 0.9) / 600;
    expect(Math.floor(progressWithSubpixelError * 5)).toBe(1);
    vi.spyOn(window, "scrollTo").mockRestore();
  });
});

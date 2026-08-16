import { act, fireEvent, render, screen } from "@testing-library/react";
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

  it("F3 · track 为横向滚动列表容器（overflow-x + 隐藏滚动条 + group 语义）", () => {
    render(
      <IntlWrapper>
        <AgentsSection
          agents={["a1", "a2"].map((id, i) => ({ ...mockAgent, id, name: `Agent ${i + 1}` }))}
        />
      </IntlWrapper>,
    );
    const track = document.querySelector("fieldset.no-scrollbar") as HTMLElement;
    expect(track).toBeTruthy();
    expect(track.className).toContain("overflow-x-auto");
    expect(track.className).toContain("no-scrollbar");
    expect(track.className).toContain("overscroll-x-contain");
    // 点亮卡带 aria-current，其余不带（不再使用嵌套交互角色 role=button）
    const cards = document.querySelectorAll("article");
    expect(cards[0].getAttribute("aria-current")).toBe("true");
    expect(cards[1].getAttribute("aria-current")).toBeNull();
  });

  it("F4 · 点击第 2 张卡 → 点亮迁移；卡片完全可见时列表不动（不搬运）", () => {
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
    // jsdom 无布局：offsetLeft/offsetWidth/clientWidth 全 0 → 卡片判定为完全可见
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      const cards = document.querySelectorAll("article");
      expect(cards[0].className).toContain("glow-accent");
      fireEvent.click(screen.getByText("Agent 2"));
      expect(cards[1].className).toContain("glow-accent");
      expect(cards[0].className).not.toContain("glow-accent");
      expect(cards[1].getAttribute("aria-current")).toBe("true");
      expect(scrollIntoView).not.toHaveBeenCalled(); // 可见 → 不滚动列表
    } finally {
      Reflect.deleteProperty(Element.prototype, "scrollIntoView");
    }
  });

  it("F5 · 点击卡片内部按钮/链接不触发点亮", () => {
    render(
      <IntlWrapper>
        <AgentsSection
          agents={["a1", "a2"].map((id, i) => ({ ...mockAgent, id, name: `Agent ${i + 1}` }))}
        />
      </IntlWrapper>,
    );
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      // 卡片内第一个真按钮（手记 outline Button）
      const innerButton = document.querySelector("article button") as HTMLElement;
      fireEvent.click(innerButton);
      expect(document.querySelectorAll("article")[0].className).toContain("glow-accent");
      expect(scrollIntoView).not.toHaveBeenCalled();
    } finally {
      Reflect.deleteProperty(Element.prototype, "scrollIntoView");
    }
  });

  it("F6 · 溢出时区内滚轮 → 拦截页面 + 列表连续横滚（scrollLeft += deltaY）", () => {
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
    const track = document.querySelector("fieldset.no-scrollbar") as HTMLElement;
    Object.defineProperty(track, "scrollWidth", { value: 2400, configurable: true });
    Object.defineProperty(track, "clientWidth", { value: 800, configurable: true });
    track.scrollLeft = 400;

    const cancelled = !fireEvent.wheel(track, { deltaY: 120 });
    expect(cancelled).toBe(true); // preventDefault：页面不动
    expect(track.scrollLeft).toBe(520); // 400 + 120 连续推进

    const cancelledUp = !fireEvent.wheel(track, { deltaY: -70 });
    expect(cancelledUp).toBe(true);
    expect(track.scrollLeft).toBe(450); // 反向同理
  });

  it("F7 · 不溢出（内容不满一屏）→ 滚轮完全放行，横滑能力不存在", () => {
    render(
      <IntlWrapper>
        <AgentsSection
          agents={["a1", "a2"].map((id, i) => ({ ...mockAgent, id, name: `Agent ${i + 1}` }))}
        />
      </IntlWrapper>,
    );
    const track = document.querySelector("fieldset.no-scrollbar") as HTMLElement;
    Object.defineProperty(track, "scrollWidth", { value: 800, configurable: true });
    Object.defineProperty(track, "clientWidth", { value: 800, configurable: true });
    track.scrollLeft = 0;

    const cancelled = !fireEvent.wheel(track, { deltaY: 120 });
    expect(cancelled).toBe(false); // 放行页面滚动
    expect(track.scrollLeft).toBe(0); // 列表未动
  });

  it("F8 · 边界放行：首端向上 / 末端向下均交还页面", () => {
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
    const track = document.querySelector("fieldset.no-scrollbar") as HTMLElement;
    Object.defineProperty(track, "scrollWidth", { value: 2400, configurable: true });
    Object.defineProperty(track, "clientWidth", { value: 800, configurable: true });

    track.scrollLeft = 0; // 首端
    const atStart = !fireEvent.wheel(track, { deltaY: -100 });
    expect(atStart).toBe(false);

    track.scrollLeft = 1600; // 末端 = 2400 − 800
    const atEnd = !fireEvent.wheel(track, { deltaY: 100 });
    expect(atEnd).toBe(false);

    // 末端向回滚仍正常劫持（放行只发生在"继续向外"方向）
    const backFromEnd = !fireEvent.wheel(track, { deltaY: -100 });
    expect(backFromEnd).toBe(true);
  });

  it("F9 · 触摸板横向手势（|deltaX|≥|deltaY|）→ 交还原生横滚，不拦截", () => {
    render(
      <IntlWrapper>
        <AgentsSection agents={[mockAgent]} />
      </IntlWrapper>,
    );
    const track = document.querySelector("fieldset.no-scrollbar") as HTMLElement;
    Object.defineProperty(track, "scrollWidth", { value: 2400, configurable: true });
    Object.defineProperty(track, "clientWidth", { value: 800, configurable: true });
    track.scrollLeft = 400;

    const cancelled = !fireEvent.wheel(track, { deltaX: 100, deltaY: 10 });
    expect(cancelled).toBe(false); // 原生处理横向滚动
    expect(track.scrollLeft).toBe(400); // 我们不代劳
  });

  it("F10 · 键盘 ←→ 移动点亮（章节与视口相交守卫）", () => {
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
    // 相交守卫读 #03 section rect（jsdom 默认全 0 → bottom=0 不相交），需 mock
    const section = document.getElementById("03") as HTMLElement;
    const sectionSpy = vi
      .spyOn(section, "getBoundingClientRect")
      .mockReturnValue({ top: -400, bottom: 600, height: 1000 } as DOMRect);

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(document.querySelectorAll("article")[1].className).toContain("glow-accent");
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(document.querySelectorAll("article")[0].className).toContain("glow-accent");

    sectionSpy.mockRestore();
    // 不相交时 ←→ 不改变点亮
    sectionSpy.mockReturnValue({ top: 2000, bottom: 3000, height: 1000 } as DOMRect);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(document.querySelectorAll("article")[0].className).toContain("glow-accent");
    sectionSpy.mockRestore();
  });

  it("F12 · 同一 tick 连发按键（按住方向键）逐次步进不丢步（命令式 ref 同步）", () => {
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
    const section = document.getElementById("03") as HTMLElement;
    const sectionSpy = vi
      .spyOn(section, "getBoundingClientRect")
      .mockReturnValue({ top: -400, bottom: 600, height: 1000 } as DOMRect);
    const cards = () => document.querySelectorAll("article");
    const glowIdx = () => Array.from(cards()).findIndex((c) => c.className.includes("glow-accent"));

    try {
      // 走到卡 3
      fireEvent.keyDown(window, { key: "ArrowRight" });
      fireEvent.keyDown(window, { key: "ArrowRight" });
      fireEvent.keyDown(window, { key: "ArrowRight" });
      expect(glowIdx()).toBe(3);
      // 同一 act 内三次 ArrowLeft 连发（模拟按住方向键、渲染未 flush 的 tick）
      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
      });
      expect(glowIdx()).toBe(0); // 修复前会停在 2（ref 等渲染周期才同步）
    } finally {
      sectionSpy.mockRestore();
    }
  });

  it("F11 · 列表停稳后点亮卡滚出视口 → 点亮转移给视口内最靠前的卡", async () => {
    vi.useFakeTimers();
    try {
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
      const track = document.querySelector("fieldset.no-scrollbar") as HTMLElement;
      // 卡片几何：步进 472px（440 卡宽 + 32 gap），视口 800px
      document.querySelectorAll("article").forEach((c, i) => {
        Object.defineProperty(c, "offsetLeft", { value: i * 472, configurable: true });
        Object.defineProperty(c, "offsetWidth", { value: 440, configurable: true });
      });
      Object.defineProperty(track, "clientWidth", { value: 800, configurable: true });
      Object.defineProperty(track, "scrollWidth", { value: 1600, configurable: true });

      // 用户横滑列表到末端：scrollLeft=1000 → 视口 [1000, 1800]，仅卡 2（944..1384）可见；点亮卡 0 不可见
      track.scrollLeft = 1000;
      fireEvent.scroll(track);
      expect(document.querySelectorAll("article")[0].className).toContain("glow-accent"); // 停稳前不变

      // 停稳窗口（advanceTimersByTimeAsync + act：允许 settle 回调内的 setState 完成 React 提交）
      await act(async () => {
        await vi.advanceTimersByTimeAsync(150);
      });
      expect(document.querySelectorAll("article")[2].className).toContain("glow-accent");
      expect(document.querySelectorAll("article")[0].className).not.toContain("glow-accent");
    } finally {
      vi.useRealTimers();
    }
  });
});

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

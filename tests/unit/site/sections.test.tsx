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

  it("F3 · 滚动进度驱动水平推进（占位容器 rect → activeIdx + track 位移）", async () => {
    const agents = ["a1", "a2", "a3", "a4"].map((id) => ({ ...mockAgent, id }));
    render(
      <IntlWrapper>
        <AgentsSection agents={agents} />
      </IntlWrapper>,
    );
    // 占位容器（pinRef）：N×67vh 高度块；jsdom 无布局，mock rect 模拟滚到底
    const pin = document.querySelector(".relative") as HTMLElement;
    const pinRect = {
      top: -900,
      bottom: 100,
      height: 1000,
      left: 0,
      right: 1000,
      width: 1000,
      x: 0,
      y: -900,
      toJSON: () => ({}),
    };
    vi.spyOn(pin, "getBoundingClientRect").mockReturnValue(pinRect as DOMRect);
    // track 位移量基于 scrollWidth
    const track = document.querySelector(".will-change-transform") as HTMLElement;
    Object.defineProperty(track, "scrollWidth", { value: 2400, configurable: true });
    Object.defineProperty(window, "innerWidth", { value: 800, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 400, configurable: true });

    fireEvent.scroll(window);
    // useRafThrottle 在 rAF 回调中执行：progress=1 → 最后一张 + 满位移
    await vi.waitFor(() => {
      expect(screen.getByText(/4\/4/)).toBeTruthy();
      expect(track.style.transform).toContain("-1600px"); // -(2400-800)
    });
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

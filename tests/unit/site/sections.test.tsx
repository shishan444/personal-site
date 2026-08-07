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
  it("F1 · 渲染所有 essays 在 TOC", () => {
    render(
      <IntlWrapper>
        <WritingSection
          essays={[mockEssay, { ...mockEssay, id: "e2", sn: "SN-002", title: "Second" }]}
        />
      </IntlWrapper>,
    );
    const allSn = screen.getAllByText(/SN-00[12]/);
    expect(allSn.length).toBeGreaterThanOrEqual(2);
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

  it("F3 · 渲染 type tag", () => {
    render(
      <IntlWrapper>
        <WritingSection essays={[mockEssay]} />
      </IntlWrapper>,
    );
    expect(screen.getByText("观点")).toBeTruthy();
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

  it("F3 · track 元素 scroll 时 activeIdx 随 scrollLeft 更新", async () => {
    const agents = ["a1", "a2", "a3", "a4"].map((id) => ({ ...mockAgent, id }));
    render(
      <IntlWrapper>
        <AgentsSection agents={agents} />
      </IntlWrapper>,
    );
    const track = document.querySelector(".overflow-x-auto") as HTMLElement;
    // jsdom 不计算布局，mock 滚动几何
    Object.defineProperty(track, "scrollWidth", { value: 1600, configurable: true });
    Object.defineProperty(track, "clientWidth", { value: 400, configurable: true });
    track.scrollLeft = 1200; // ratio = 1200/(1600-400) = 1 → 最后一张
    fireEvent.scroll(track);
    // useRafThrottle 在 rAF 回调中执行更新，轮询等待一帧后的结果
    await vi.waitFor(() => {
      expect(screen.getByText(/4\/4/)).toBeTruthy();
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

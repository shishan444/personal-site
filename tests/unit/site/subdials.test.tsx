import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LdSubdial } from "@/components/site/subdials/ld-subdial";
import { LuSubdial } from "@/components/site/subdials/lu-subdial";
import { RdSubdial, RING_CIRCUMFERENCE } from "@/components/site/subdials/rd-subdial";
import { RuSubdial } from "@/components/site/subdials/ru-subdial";

describe("L1 · LuSubdial 章节编号", () => {
  it("F1 · 渲染 index/total 格式", () => {
    render(<LuSubdial index={3} total={5} chapterId="03" chapterName="AGENTS" visible={true} />);
    expect(screen.getByText("03")).toBeTruthy();
    expect(screen.getByText("/ 05")).toBeTruthy();
    expect(screen.getByText("AGENTS")).toBeTruthy();
  });

  it("F2 · visible=false 时 chapterName 颜色变浅", () => {
    const { container } = render(
      <LuSubdial index={1} total={5} chapterId="01" chapterName="HERO" visible={false} />,
    );
    const nameEl = container.querySelectorAll("div")[container.querySelectorAll("div").length - 1];
    expect(nameEl?.className).toContain("text-[var(--color-ink-soft)]");
  });

  it("F3 · chapterId 切换触发 tick-flip key 更新", () => {
    const { rerender } = render(
      <LuSubdial index={1} total={5} chapterId="01" chapterName="HERO" visible={true} />,
    );
    const firstIndex = screen.getByText("01");
    expect(firstIndex).toBeTruthy();

    rerender(<LuSubdial index={2} total={5} chapterId="02" chapterName="WRITING" visible={true} />);
    expect(screen.getByText("02")).toBeTruthy();
    expect(screen.getByText("WRITING")).toBeTruthy();
  });
});

describe("L1 · RuSubdial 索引刻度尺", () => {
  it("F1 · 渲染所有章节 id", () => {
    render(
      <RuSubdial
        chapterIds={["01", "02", "03", "04", "05"]}
        activeId="02"
        visitedIds={new Set(["01", "02"])}
      />,
    );
    expect(screen.getByText("01")).toBeTruthy();
    expect(screen.getByText("02")).toBeTruthy();
    expect(screen.getByText("03")).toBeTruthy();
  });

  it("F2 · active 节点最高", () => {
    const { container } = render(
      <RuSubdial chapterIds={["01", "02"]} activeId="01" visitedIds={new Set(["01"])} />,
    );
    const bars = container.querySelectorAll(".h-6, .h-3, .h-1\\.5");
    const activeBar = container.querySelector(".h-6");
    expect(activeBar).toBeTruthy();
    expect(bars.length).toBeGreaterThan(0);
  });

  it("F3 · visited 但非 active 中等高度", () => {
    const { container } = render(
      <RuSubdial
        chapterIds={["01", "02", "03"]}
        activeId="03"
        visitedIds={new Set(["01", "02", "03"])}
      />,
    );
    const passedBars = container.querySelectorAll(".h-3.bg-\\[var\\(--color-ink-mute\\)\\]");
    expect(passedBars.length).toBe(2);
  });
});

describe("L1 · LdSubdial 活跃内容", () => {
  it("F1 · 渲染 eyebrow + title + desc", () => {
    render(
      <LdSubdial
        eyebrow="ESSAY"
        title="Agents are coworkers"
        desc="some description"
        visible={true}
      />,
    );
    expect(screen.getByText("ESSAY")).toBeTruthy();
    expect(screen.getByText("Agents are coworkers")).toBeTruthy();
    expect(screen.getByText("some description")).toBeTruthy();
  });

  it("F2 · visible=false 应用 opacity-40", () => {
    const { container } = render(<LdSubdial eyebrow="X" title="Y" visible={false} />);
    expect(container.firstElementChild?.className).toContain("opacity-40");
  });

  it("F3 · 无 desc 不渲染 desc 节点", () => {
    const { container } = render(<LdSubdial eyebrow="X" title="Y" visible={true} />);
    expect(container.querySelectorAll("div").length).toBeLessThanOrEqual(3);
  });
});

describe("L1 · RdSubdial 92px 微型刻度环", () => {
  it("F1 · progress=0 时 dashOffset = 圆周长", () => {
    const { container } = render(<RdSubdial progress={0} />);
    const progressCircle = container.querySelectorAll("circle")[1];
    const offset = Number(progressCircle.getAttribute("stroke-dashoffset"));
    expect(Math.abs(offset - RING_CIRCUMFERENCE)).toBeLessThan(0.01);
  });

  it("F2 · progress=1 时 dashOffset = 0（环闭合）", () => {
    const { container } = render(<RdSubdial progress={1} />);
    const progressCircle = container.querySelectorAll("circle")[1];
    const offset = Number(progressCircle.getAttribute("stroke-dashoffset"));
    expect(offset).toBeLessThan(0.01);
  });

  it("F3 · progress=0.5 时 dashOffset = 半周长", () => {
    const { container } = render(<RdSubdial progress={0.5} />);
    const progressCircle = container.querySelectorAll("circle")[1];
    const offset = Number(progressCircle.getAttribute("stroke-dashoffset"));
    expect(Math.abs(offset - RING_CIRCUMFERENCE / 2)).toBeLessThan(0.01);
  });

  it("F4 · progress 超出 [0,1] 应被 clamp", () => {
    const { container: c1 } = render(<RdSubdial progress={-1} />);
    const { container: c2 } = render(<RdSubdial progress={2} />);
    const o1 = Number(c1.querySelectorAll("circle")[1].getAttribute("stroke-dashoffset"));
    const o2 = Number(c2.querySelectorAll("circle")[1].getAttribute("stroke-dashoffset"));
    expect(o1).toBeCloseTo(RING_CIRCUMFERENCE, 1);
    expect(o2).toBeCloseTo(0, 1);
  });

  it("F5 · 12 个刻度线", () => {
    const { container } = render(<RdSubdial progress={0} />);
    const ticks = container.querySelectorAll("line");
    expect(ticks.length).toBe(13);
  });

  it("F6 · metaLine1/2 渲染", () => {
    render(<RdSubdial progress={0.5} metaLine1="v0.4" metaLine2="NEXT Q3" />);
    expect(screen.getByText("v0.4")).toBeTruthy();
    expect(screen.getByText("NEXT Q3")).toBeTruthy();
  });

  it("F7 · RING_CIRCUMFERENCE 数值正确（2π*36）", () => {
    expect(RING_CIRCUMFERENCE).toBeCloseTo(2 * Math.PI * 36, 2);
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge, statusBadgeVariants } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ChipInput } from "@/components/ui/chip-input";

describe("L1 · Button 组件", () => {
  it("F1 · 渲染默认 variant", () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole("button", { name: "Save" });
    expect(btn.className).toContain(buttonVariants({ variant: "default" }));
  });

  it("F2 · variant=outline 切换样式", () => {
    render(<Button variant="outline">Cancel</Button>);
    const btn = screen.getByRole("button", { name: "Cancel" });
    expect(btn.className).toContain("border");
    expect(btn.className).toContain("bg-transparent");
  });

  it("F3 · size=lg 应用大尺寸", () => {
    render(<Button size="lg">Big</Button>);
    expect(screen.getByRole("button", { name: "Big" }).className).toContain("h-12");
  });

  it("F4 · asChild 渲染为子元素", () => {
    render(
      <Button asChild>
        <a href="/x">Link Button</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Link Button" });
    expect(link.tagName).toBe("A");
    expect(link.className).toContain(buttonVariants({ variant: "default" }));
  });

  it("F5 · onClick 回调可触发", () => {
    const handler = vi.fn();
    render(<Button onClick={handler}>Click</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Click" }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("F6 · disabled 状态阻断 click", () => {
    const handler = vi.fn();
    render(
      <Button disabled onClick={handler}>
        NoClick
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "NoClick" }));
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("L1 · KpiCard 组件", () => {
  it("F1 · 渲染 label + value + hint", () => {
    render(<KpiCard label="AGENTS" value={6} hint="2 in beta" />);
    expect(screen.getByText("AGENTS")).toBeTruthy();
    expect(screen.getByText("6")).toBeTruthy();
    expect(screen.getByText("2 in beta")).toBeTruthy();
  });

  it("F2 · accent=true 应用左侧 accent border", () => {
    const { container } = render(<KpiCard label="X" value="1" accent />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("border-l-[var(--color-accent)]");
  });

  it("F3 · 无 hint 时不渲染 hint 节点", () => {
    const { container } = render(<KpiCard label="X" value="1" />);
    expect(container.textContent).not.toContain("hint");
  });
});

describe("L1 · StatusBadge 组件", () => {
  it("F1 · variant=warn 应用 accent 颜色", () => {
    render(<StatusBadge variant="warn">BETA</StatusBadge>);
    expect(screen.getByText("BETA").className).toContain(statusBadgeVariants({ variant: "warn" }));
  });

  it("F2 · dot=true 渲染圆点", () => {
    const { container } = render(
      <StatusBadge variant="active" dot>
        LIVE
      </StatusBadge>,
    );
    const dot = container.querySelector("span > span");
    expect(dot).toBeTruthy();
    expect(dot?.className).toContain("rounded-full");
  });
});

describe("L1 · ChipInput 组件", () => {
  it("F1 · 渲染已存在的 chips", () => {
    render(<ChipInput value={["AI", "Agent"]} onChange={() => {}} />);
    expect(screen.getByText("AI")).toBeTruthy();
    expect(screen.getByText("Agent")).toBeTruthy();
  });

  it("F2 · Enter 提交新 chip", () => {
    const onChange = vi.fn();
    render(<ChipInput value={[]} onChange={onChange} placeholder="输入" />);
    const input = screen.getByPlaceholderText("输入");
    fireEvent.change(input, { target: { value: "NewTag" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["NewTag"]);
  });

  it("F3 · 逗号也触发提交", () => {
    const onChange = vi.fn();
    render(<ChipInput value={[]} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "tag1" } });
    fireEvent.keyDown(input, { key: "," });
    expect(onChange).toHaveBeenCalledWith(["tag1"]);
  });

  it("F4 · Backspace 删除最后一个 chip", () => {
    const onChange = vi.fn();
    render(<ChipInput value={["only"]} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("F5 · 重复 chip 不被添加", () => {
    const onChange = vi.fn();
    render(<ChipInput value={["dup"]} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "dup" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("F6 · 点击 X 删除特定 chip", () => {
    const onChange = vi.fn();
    const { container } = render(<ChipInput value={["keep", "drop"]} onChange={onChange} />);
    const buttons = container.querySelectorAll("button");
    fireEvent.click(buttons[1]);
    expect(onChange).toHaveBeenCalledWith(["keep"]);
  });
});

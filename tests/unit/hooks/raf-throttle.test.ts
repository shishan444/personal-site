import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRafThrottle } from "@/hooks/use-raf-throttle";

describe("L1 · useRafThrottle", () => {
  beforeEach(() => {
    let frame = 1;
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((cb: FrameRequestCallback) => {
        const id = frame++;
        setTimeout(() => cb(performance.now()), 0);
        return id;
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("F1 · 多次调用只触发一次 rAF tick", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useRafThrottle(cb));
    for (let i = 0; i < 5; i++) result.current(1 as never);
    expect(cb).not.toHaveBeenCalled();
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(cb).toHaveBeenCalledTimes(1);
        resolve();
      }, 10);
    });
  });

  it("F2 · 不同参数应被最新参数覆盖", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useRafThrottle(cb));
    result.current("a" as never);
    result.current("b" as never);
    result.current("c" as never);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb).toHaveBeenCalledWith("c");
        resolve();
      }, 10);
    });
  });
});

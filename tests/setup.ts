import "@testing-library/jest-dom/vitest";

class MockIntersectionObserver {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds: ReadonlyArray<number> = [];
  private elements: Element[] = [];
  constructor(callback: IntersectionObserverCallback) {
    void callback;
  }
  observe(target: Element): void {
    this.elements.push(target);
  }
  unobserve(): void {}
  disconnect(): void {
    this.elements = [];
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

if (!globalThis.IntersectionObserver) {
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    MockIntersectionObserver;
}

if (!globalThis.requestAnimationFrame) {
  (
    globalThis as unknown as { requestAnimationFrame: (cb: FrameRequestCallback) => number }
  ).requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16) as unknown as number;
  (globalThis as unknown as { cancelAnimationFrame: (id: number) => void }).cancelAnimationFrame = (
    id: number,
  ) => clearTimeout(id);
}

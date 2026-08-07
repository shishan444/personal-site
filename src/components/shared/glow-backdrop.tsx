/**
 * 底层光环境：暖金/暗绿径向光斑 fixed 背景层。
 * 玻璃 blur 需要背后有可透内容，这是暖玻璃材质可见的前提。
 * 纯 CSS 渲染（.atelier-glow），无 JS、无动画、pointer-events 不拦截。
 */
export function GlowBackdrop({ variant = "site" }: { variant?: "site" | "admin" }) {
  return (
    <div
      aria-hidden
      className={variant === "admin" ? "atelier-glow atelier-glow-admin" : "atelier-glow"}
    />
  );
}

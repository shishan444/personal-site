import { GlowBackdrop } from "@/components/shared/glow-backdrop";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlowBackdrop variant="site" />
      {children}
    </>
  );
}

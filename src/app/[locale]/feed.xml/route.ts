import { getHomeEssays } from "@/lib/queries/site";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const essays = await getHomeEssays(locale).catch(() => []);

  const items = essays
    .map(
      (e) => `
    <item>
      <title>${escapeXml(e.title.replace(/<\/?em>/g, ""))}</title>
      <link>${baseUrl}/${locale}/writing/${e.slug}</link>
      <guid>${baseUrl}/${locale}/writing/${e.slug}</guid>
      <pubDate>${e.publishedAt ? new Date(e.publishedAt).toUTCString() : new Date().toUTCString()}</pubDate>
      <description>${escapeXml(e.deck)}</description>
    </item>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>ATELIER (${locale})</title>
    <link>${baseUrl}/${locale}</link>
    <description>A factory of agents, in kinetic motion.</description>
    <language>${locale}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

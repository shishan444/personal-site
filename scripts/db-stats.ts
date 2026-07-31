import { getPgliteDb } from "../src/lib/db/pglite";
import { agents, assetLinks, essays, siteConfig, timelineNodes, users } from "../src/lib/db/schema";

async function main() {
  const db = await getPgliteDb();

  const u = await db.select().from(users);
  const c = await db.select().from(siteConfig);
  const a = await db.select().from(agents);
  const t = await db.select().from(timelineNodes);
  const e = await db.select().from(essays);
  const l = await db.select().from(assetLinks);

  console.log("════════════════════════════════════════");
  console.log("  ATELIER · DB Stats（开发库）");
  console.log("════════════════════════════════════════");
  console.log(`  users          : ${u.length}`);
  console.log(`  site_config    : ${c.length} (id=${c[0]?.id}, name=${c[0]?.siteName})`);
  console.log(`  agents         : ${a.length} (sn: ${a.map((x) => x.sn).join(", ")})`);
  console.log(`  timeline_nodes : ${t.length} (versions: ${t.map((x) => x.version).join(", ")})`);
  console.log(`  essays         : ${e.length} (sn: ${e.map((x) => x.sn).join(", ")})`);
  console.log(`  asset_links    : ${l.length}`);
  console.log("════════════════════════════════════════");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

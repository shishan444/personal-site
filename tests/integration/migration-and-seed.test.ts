import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getPgliteDb } from "@/lib/db/pglite";
import { agents, assetLinks, essays, siteConfig, timelineNodes, users } from "@/lib/db/schema";
import { loadDemoSeed } from "./_seed-helper";

async function expectReject(sql: string, pattern: RegExp) {
  const db = await getPgliteDb();
  let caught: unknown;
  try {
    await db.execute(sql);
  } catch (err) {
    caught = err;
  }
  expect(caught, `expected SQL to fail: ${sql}`).toBeDefined();
  const cause = caught instanceof Error ? caught.cause : undefined;
  const errStr = `${String(caught)} ${JSON.stringify(cause ?? {})}`;
  expect(errStr).toMatch(pattern);
}

describe("L2 · Migration + Seed 集成", () => {
  it("迁移后所有表应存在", async () => {
    const db = await getPgliteDb();
    const res = (await db.execute(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `)) as unknown as { rows: { tablename: string }[] };

    const tableNames = res.rows.map((r) => r.tablename);
    expect(tableNames).toContain("users");
    expect(tableNames).toContain("sessions");
    expect(tableNames).toContain("accounts");
    expect(tableNames).toContain("verifications");
    expect(tableNames).toContain("assets");
    expect(tableNames).toContain("agents");
    expect(tableNames).toContain("essays");
    expect(tableNames).toContain("timeline_nodes");
    expect(tableNames).toContain("asset_links");
    expect(tableNames).toContain("site_config");
    expect(tableNames).toContain("essay_revisions");
    expect(tableNames).toContain("audit_logs");
  });

  it("迁移后所有枚举应存在", async () => {
    const db = await getPgliteDb();
    const res = (await db.execute(`
      SELECT typname FROM pg_type
      WHERE typtype = 'e'
      ORDER BY typname;
    `)) as unknown as { rows: { typname: string }[] };

    const enumNames = res.rows.map((r) => r.typname);
    expect(enumNames).toContain("language");
    expect(enumNames).toContain("essay_status");
    expect(enumNames).toContain("agent_status");
    expect(enumNames).toContain("timeline_type");
    expect(enumNames).toContain("user_role");
  });

  it("Timeline 部分唯一索引应强制 is_now 同时只有一个", async () => {
    const db = await getPgliteDb();
    await loadDemoSeed(db);
    await expectReject(
      `INSERT INTO timeline_nodes (version, name, "desc", type, date, is_now) VALUES ('v0.5', 'test', 'test', 'now', '2026-12-01', true);`,
      /timeline_one_now_idx|unique|duplicate|23505/i,
    );
  });

  it("site_config CHECK 约束应强制 id=1", async () => {
    await expectReject(
      `INSERT INTO site_config (id, site_name, subtitle, current_version, current_calibre, hero_sub, rd_meta_1, rd_meta_2, subdials_config, chapters_config, global_stats, theme) VALUES (2, 'x', 'x', 'v0', '00', 'x', 'x', 'x', '{}', '[]', '{}', 'warm-amber');`,
      /site_config_single_row|check|violates/i,
    );
  });

  it("Seed 后应有 1 owner / 1 config / 6 agents / 5 timeline / 5 essays", async () => {
    const db = await getPgliteDb();
    await loadDemoSeed(db);

    const owner = await db.select().from(users).where(eq(users.role, "owner"));
    expect(owner.length).toBe(1);

    const config = await db.select().from(siteConfig);
    expect(config.length).toBe(1);
    expect(config[0].id).toBe(1);

    const allAgents = await db.select().from(agents);
    expect(allAgents.length).toBe(6);

    const timeline = await db.select().from(timelineNodes);
    expect(timeline.length).toBe(5);
    expect(timeline.filter((t) => t.isNow).length).toBe(1);

    const allEssays = await db.select().from(essays);
    expect(allEssays.length).toBe(5);
  });

  it("asset_links 多态关联应可正常插入", async () => {
    const db = await getPgliteDb();
    await loadDemoSeed(db);

    const firstEssay = (await db.select().from(essays).limit(1))[0];

    await db.execute(`
      INSERT INTO assets (id, filename, original_filename, mime_type, size_bytes,
                          storage_path, checksum, uploaded_by)
      VALUES (
        'c1000001-0000-0000-0000-000000000001',
        'test-image.png', 'test.png', 'image/png', 12345,
        '/uploads/test.png', 'sha256-fake', '00000000-0000-0000-0000-000000000001'
      );
    `);

    await db.insert(assetLinks).values({
      assetId: "c1000001-0000-0000-0000-000000000001",
      sourceType: "essay",
      sourceId: firstEssay.id,
      usage: "inline_image",
      orderIndex: 0,
    });

    const links = await db.select().from(assetLinks);
    expect(links.length).toBe(1);
    expect(links[0].sourceType).toBe("essay");
  });

  it("translation_group_id 应允许多语言共享", async () => {
    const db = await getPgliteDb();
    await loadDemoSeed(db);

    const zhEssay = (await db.select().from(essays).where(eq(essays.lang, "zh")).limit(1))[0];

    const [enVersion] = await db
      .insert(essays)
      .values({
        sn: "SN-EN-001",
        lang: "en",
        translationGroupId: zhEssay.translationGroupId,
        title: "English version",
        deck: "EN deck",
        body: "EN body",
        typeTag: "essay",
        status: "published",
        authorId: "00000000-0000-0000-0000-000000000001",
      })
      .returning();

    expect(enVersion.lang).toBe("en");
    expect(enVersion.translationGroupId).toBe(zhEssay.translationGroupId);
  });

  it("外键约束应阻止删除被引用的 user", async () => {
    const db = await getPgliteDb();
    await loadDemoSeed(db);
    await expectReject(
      `DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001';`,
      /foreign|restrict|violates|23001|23503/i,
    );
  });

  it("essays.slug 部分唯一索引应允许 NULL 但拒绝重复", async () => {
    const db = await getPgliteDb();
    await loadDemoSeed(db);

    await db.execute(`UPDATE essays SET slug = NULL WHERE sn = 'SN-028';`);
    await db.execute(`UPDATE essays SET slug = NULL WHERE sn = 'SN-027';`);

    await db.execute(`UPDATE essays SET slug = 'duplicate-slug' WHERE sn = 'SN-028';`);
    await expectReject(
      `UPDATE essays SET slug = 'duplicate-slug' WHERE sn = 'SN-027';`,
      /essays_slug_idx|unique|duplicate|23505/i,
    );
  });
});

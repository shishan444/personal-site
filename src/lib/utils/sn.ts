import { getDb } from "@/lib/db";
import { agents, essays } from "@/lib/db/schema";

/**
 * 顺序生成 SN（用户裁决 2026-08-15）：编号 = 当前最大数字 + 1，替代随机数，杜绝唯一索引冲突。
 * 位宽沿用表内现有 SN 的最大位宽（essays 默认 3 位 SN-001，agents 默认 2 位 CAL.A-01）。
 */
export async function nextSequenceSn(
  table: "essays" | "agents",
  prefix: string,
  minWidth = table === "essays" ? 3 : 2,
): Promise<string> {
  const db = await getDb();
  const rows =
    table === "essays"
      ? await db.select({ sn: essays.sn }).from(essays)
      : await db.select({ sn: agents.sn }).from(agents);

  let maxNum = 0;
  let width = minWidth;
  for (const row of rows) {
    const match = row.sn.match(/(\d+)\s*$/);
    if (!match) continue;
    const num = Number.parseInt(match[1], 10);
    if (num > maxNum) maxNum = num;
    width = Math.max(width, match[1].length);
  }

  const next = maxNum + 1;
  return `${prefix}${String(next).padStart(width, "0")}`;
}

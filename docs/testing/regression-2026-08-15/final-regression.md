# 最终完整回归报告 · fix/design-compliance（人工确认前置）

> 2026-08-15 · HEAD 23 commits（含 Writing 改版与 e2e 适配）

## 自动化全量（Phase 1-2）

| # | 层 | 结果 |
|---|---|---|
| 1 | 类型 tsc | ✅ 0 错误 |
| 2 | lint biome | ✅ clean（1 info 为既有 deprecated 提示） |
| 3 | L1 单元 + 覆盖率门 | ✅ 197/197（26 文件）exit 0 |
| 4 | L2 集成（真实 PGlite） | ✅ 68/68（11 文件） |
| 5 | 冒烟 | ✅ 10/10 |
| 6 | 生产构建 | ✅ 39 页 |
| 7 | Playwright e2e | ⚠️ **8/9 通过**（见遗留） |

## e2e 过程发现并修复（本回归直接产出）

1. seed 缺 owner@atelier.com 测试账号（裁决 #3 改 seed 的连带）→ seed 恢复 e2e 专用账号（与演示账号并存）
2. B1/B2 断言过时（i18n「✓ 发布」/编辑保存留页/删除 confirm 弹窗）→ spec 修复
3. 过程事故（如实记录）：main 归属判定时未提交改动被 checkout 覆盖 → 三处修复重新应用并提交（内容一致）

## 遗留（不阻塞人工确认）

- **B19 Agent 拖拽排序持久化**：稳定失败。本分支对 sortable-list/reorder 零 diff（git 已证），最后绿记录为 8/6；属暖玻璃批后未复跑的既存回归，待专项修复
- B19 归属判定尝试（main 对照）无效：main seed 无 e2e 账号 setup 先挂

## L3 浏览器走查要点（供人工确认对照）

前台 /zh：①hero 四格数字 ②02 章节贴左布局+目录 hover 特效+摘要卡+查看原文↗ ③03 滚动驱动水平推进+LD 联动 ④04 时间轴推进 ⑤四角标签无重叠
后台 /zh/admin：⑥删除二次确认 ⑦回收站恢复/彻底删除 ⑧资产拖拽上传+白名单 ⑨Timeline 新建/编辑 ⑩Toast 反馈

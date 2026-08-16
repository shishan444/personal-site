# 全量回归测试报告 · fix/design-compliance（design-test-cases 三层）

> 日期：2026-08-15 · HEAD：fix/design-compliance（含 L3 修复 3 commits，共 18 commits）

## L1/L2/构建（自动化，终态复跑）

| 层 | 范围 | 结果 |
|---|---|---|
| L1 单元 | 26 文件 195 用例 + 覆盖率门（33/26/33/32） | PASS（exit 0） |
| L2 集成 | 11 文件 68 用例（真实 PGlite：软删除/回收站/外链/SN/资产引用） | PASS |
| 冒烟 | 10 用例（middleware/路径穿越/Shiki/渲染） | PASS |
| 类型 | tsc --noEmit | 0 错误 |
| 构建 | next build | 39 页成功 |

## L3 真实浏览器（Chrome + dev server，四功能面）

| # | 功能面 | 操作与断言 | 结果 |
|---|---|---|---|
| 1 | 滚动驱动（Agents） | 滚至 60% 占位：transform 0→-334px、计数 1/5→3/5、占位 3.3×vh=5×67vh | **PASS** |
| 2 | 回收站闭环 | 编辑页点删除→redirect 列表→回收站显示「文章·SN-022」→点恢复→Toast「已恢复」→回收站清空 | **PASS** |
| 3 | 上传白名单 | exe 伪装 → 415 MIME_NOT_ALLOWED；png → 201 | **PASS** |
| 4a | Timeline 新页 | /admin/timeline/new 200（原 404） | **PASS** |
| 4b | use 页语义 | external 型 agent /use → 404（设计行为：仅 iframe 型开放） | **PASS** |
| 4c | hero globalStats | 四格 2 agents/1 agent/5 essays/04·28.8k vph，零未解析占位符 | **PASS** |

## L3 实测发现并修复的缺陷（本轮回归的直接产出）

1. **删除按钮无二次确认**（原计划 P0-5 漏做）→ 补 ConfirmSubmit 组件
2. **server component 内联 onSubmit 致编辑页 SSR 崩溃**（修复 1 的第一版实现错误，浏览器实测发现「↻ 重试」错误态）→ 改客户端组件
3. **globalStats 占位符未替换**（seed 模板 {essays_published}/{current_cal} 与 vars 键名不匹配，单测自造数据未覆盖）→ 补 spec 8.6 命名别名

## 结论

三层全绿，18 commits 全部验证。审计 #5/#13/#17/#19/#24/#30/#1/#2/#4/#5/#11/#13B 等 15 条裁决交付在真实浏览器下行为正确。

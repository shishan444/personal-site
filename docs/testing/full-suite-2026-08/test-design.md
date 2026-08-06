# ATELIER · 全量测试设计（full-suite-2026-08）

> 状态：**draft** · 待用户批准
> 范围：`personal-site/atelier` 真实工程
> 方法：design-test-cases skill（L1/L2/L3 三层 + 正反风险闭合）
> 编写日期：2026-08-06

---

## 0. 任务定位

### 0.1 用户原话
「分析 personal-site 工程，使用 design-test-cases 对工程进行全量测试」

### 0.2 已确认事实（来自代码与文档）
- **README 状态过期**：根目录 README.md 标注阶段二进度 0%；实际 `atelier/` 已基本完成阶段二全部子任务（2.1–2.12）
- **真实代码规模**：src 共 120 个 .ts/.tsx 文件（app 35 / components 36 / lib 42 / hooks 3 / i18n 3 + middleware）
- **现有测试**：L1 单元 14 文件 108 用例 / L2 集成 5 文件 39 用例 / L3 smoke 10 用例 / L3 Playwright 8 spec
- **现有覆盖率**：行 17.01%、函数 16.9%、分支 15.47%（vitest 阈值 85/90/80 严重不达标）
- **TEST-STRATEGY.md 是计划态**：估算 830–1330 用例 / 230–450 小时，远超本轮现实可用预算

### 0.3 任务边界（升维后的判断）
- **在本轮范围**：基于代码事实盘点功能点 → 补关键 L1/L2 缺口 → 跑全 L1+L2+L3 出真实证据 → 报告剩余风险
- **不在本轮范围**：
  - 重写已有用例（已有质量较高）
  - 按 TEST-STRATEGY.md 计划补到 800+ 用例（230+ 小时不现实）
  - L4 性能基线（需独立环境与 Lighthouse，单独任务）
  - L5 AI 录制回归（已有截图可参考，新一轮需独立任务）

---

## 1. 需求世界还原

### 1.1 项目身份
ATELIER：AI Agent 创作者的个人站点。三重身份：观点容器（文章）、Agent 橱窗（可点击体验）、演进档案（版本时间轴）。前台用滚动联动的运动学机械感（4 角子表盘 + 水平推进 + stroke-dasharray 绘制）把"在变好"做成内容。

### 1.2 角色与权责
| 主体 | 权限 | 主要动作 |
|------|------|---------|
| owner（单用户） | 全部 admin | 文章/Agent/Timeline/资产/标签/站点配置 CRUD |
| 访客 | 前台只读 | 浏览、切语言、搜索、点击 Agent launch |
| middleware | 守卫 | 无 session cookie → /login；有 cookie → 放行 |
| DB 约束 | 不变量 | SN/slug/order 唯一；timeline_one_now 部分唯一；asset_links FK restrict |

### 1.3 关键变化链
**文章流（F1）**：admin 创建草稿 → 自动生成 translationGroupId + words + readMinutes + revision(created) + audit → 编辑（产生 revision(edited)）→ 发布（draft→published, publishedAt 设置, revision(published), audit(publish)）→ 前台 `/zh/writing/{slug}` 可见（published + lang 匹配）→ 归档/恢复 → 删除（级联清 revisions）

**Agent 流（F2）**：admin 创建 → 自动 order=max+1（避 agents_order_idx 冲突）→ 编辑 specs/launch/cardImage → 拖拽排序（两阶段抬升避开唯一索引）→ 前台 `/zh` AgentsSection 显示（status≠archived）→ 详情页 `/zh/agents/{sn}` → launch（external/iframe/modal）→ 删除

**Timeline 流（F3）**：admin 创建 → 若 isNow=true 先取消其他 NOW → setAsNow 同时取消其他 + 设 type=now → DB 部分唯一索引兜底 → 前台 4 角子表盘 + SVG 时间轴显示

**资产流（F4）**：admin 上传 → 计算 SHA-256 → 命中已有 checksum 直接复用（isDuplicate=true）→ 否则写盘 + sharp 生成 _thumbnails/*.webp + 读 width/height → 写 assets 表 → 通过 asset_links 多态关联到 essay/agent/timeline_node → 删除前查引用（REFERENCED 拒绝 / 无引用真删）

**认证流（F5）**：首次启动用 ADMIN_INIT_PASSWORD 种子 → 登录 → mustChangePassword=true → 强制改密 → session token（base64url 32 字节）→ cookie httpOnly + 14 天 TTL → middleware 校验 cookie → 过期 session 自动清

**i18n（F6）**：URL 子路径 `/zh/` `/en/` → next-intl routing → cookie 记忆 → zh.json/en.json 同 key 守卫

**安全守卫（F10）**：uploads `[...path]` 路由拒绝 `..` 路径穿越（403）+ 不存在文件 404；middleware 无 cookie 重定向 /login（避免失效 cookie 死循环）

---

## 2. 功能点清单（基于代码事实）

| ID | 模块 | 功能点 | 当前 L1 | 当前 L2 | 当前 L3 |
|----|------|--------|---------|---------|---------|
| F1.1 | Essay | 创建草稿（含 translationGroupId/words/readMinutes 自动） | – | – | B1 ✓ |
| F1.2 | Essay | 更新草稿（产生 edited revision） | – | – | B1 ✓ |
| F1.3 | Essay | 发布（draft→published, publishedAt） | – | – | B1 ✓ |
| F1.4 | Essay | 归档（published→archived） | – | – | – |
| F1.5 | Essay | 恢复（archived→published） | – | – | – |
| F1.6 | Essay | 删除（级联 revisions） | – | – | B1 ✓ |
| F1.7 | Essay | 批量改状态 | – | – | – |
| F1.8 | Essay | 历史版本恢复（产生 restored revision） | – | – | – |
| F1.9 | Essay | SN 唯一性（DB uniqueIndex 守卫） | – | – | – |
| F1.10 | Essay | Slug 唯一性（部分唯一索引） | – | – | – |
| F1.11 | Essay | audit log 写入 | – | 部分 | – |
| F2.1 | Agent | 创建（自动 order=max+1） | – | – | B2 ✓ |
| F2.2 | Agent | 更新 | – | – | B2 ✓ |
| F2.3 | Agent | 删除 | – | – | – |
| F2.4 | Agent | 拖拽排序（两阶段避唯一索引） | – | – | B19 ✓ |
| F2.5 | Agent | SN 唯一性 | – | – | – |
| F2.6 | Agent | status 枚举守卫 | – | – | – |
| F3.1 | Timeline | 创建节点（isNow=true 取消其他） | 部分 | – | – |
| F3.2 | Timeline | 更新节点 | – | – | – |
| F3.3 | Timeline | setAsNow（取消其他 + type=now） | – | – | – |
| F3.4 | Timeline | 删除节点 | – | – | – |
| F3.5 | Timeline | timeline_one_now_idx 部分唯一索引 | – | – | – |
| F4.1 | Asset | 上传（checksum 去重 + 缩略图 + 元数据） | 部分 | ✓ | – |
| F4.2 | Asset | linkAsset 多态关联 | – | ✓ | – |
| F4.3 | Asset | unlinkAsset | – | ✓ | – |
| F4.4 | Asset | 软删除（deleteAssetIfUnreferenced） | – | ✓ | – |
| F4.5 | Asset | 引用检查（REFERENCED 拒绝） | – | ✓ | – |
| F4.6 | Asset | Agent 截图 link/unlink/reorder | – | – | B20 ✓ |
| F5.1 | Auth | 邮箱密码登录 | – | ✓ | B11 ✓ |
| F5.2 | Auth | 强制改密（mustChangePassword） | – | – | B11 ✓ |
| F5.3 | Auth | session 创建/读取/销毁 | – | ✓ | B11 ✓ |
| F5.4 | Auth | session 过期清理 | – | ✓ | – |
| F5.5 | Auth | middleware 守卫（含失效 cookie 防死循环） | – | – | smoke ✓ |
| F6.1 | i18n | 子路径 /zh/ /en/ 路由 | ✓ | – | B7 ✓ |
| F6.2 | i18n | cookie 记忆 | – | – | B7 ✓ |
| F6.3 | i18n | 文案 key 完整性 | ✓ | – | – |
| F7.1 | SiteConfig | 单行约束（CHECK id=1） | – | – | – |
| F7.2 | SiteConfig | 更新（影响前台显示） | – | – | – |
| F8.1 | Tag | mergeTopicTag（替换 + 去重） | – | – | – |
| F9.1 | SEO | robots.ts | – | – | smoke ✓ |
| F9.2 | SEO | manifest.ts | – | – | smoke ✓ |
| F9.3 | SEO | sitemap.ts | – | – | smoke ✓ |
| F10.1 | Sec | uploads 路径穿越守卫 | – | – | smoke ✓ |
| F10.2 | Sec | middleware 重定向 | – | – | smoke ✓ |
| F10.3 | Sec | audit 持久化（容错吞错） | – | 部分 | – |
| F11.1 | UI | LuSubdial 章节编号 + tick-flip | ✓ | – | – |
| F11.2 | UI | RuSubdial 章节导航 + active 高亮 | ✓ | – | – |
| F11.3 | UI | LdSubdial 活跃内容 | ✓ | – | – |
| F11.4 | UI | RdSubdial 92px 刻度环（progress clamp + dasharray） | ✓ | – | – |
| F11.5 | UI | HeroSection（active 数 + meta） | ✓ | – | – |
| F11.6 | UI | WritingSection（TOC + active deck） | ✓ | – | – |
| F11.7 | UI | AgentsSection（coming 隐藏 launch） | ✓ | – | – |
| F11.8 | UI | TimelineSection（SVG + changes） | ✓ | – | – |
| F11.9 | UI | OutroSection | ✓ | – | – |
| F11.10 | UI | markdown 渲染（含 Shiki） | ✓ | – | smoke ✓ |

「–」= 未覆盖。「✓」= 已有用例。

---

## 3. 正反闭合检查

### 3.1 正向（起点 → 终态）
- 文章：草稿 → 发布 → 前台可见 → 删除 → 前台 404（B1 已闭合）
- Agent：创建 → 拖拽排序 → 前台顺序一致 → 删除（B2+B19 部分闭合，缺删除断言）
- 资产：上传 → 关联 essay/agent → 删除前查引用（L2 已闭合）
- 认证：种子密码 → 强制改密 → session → 退出（B11 已闭合）

### 3.2 反向（守卫 / 不变量 / 禁止结果）
- ✅ F1.9 SN 唯一 → 缺测试
- ✅ F1.10 Slug 唯一 → 缺测试
- ✅ F2.5 Agent SN 唯一 → 缺测试
- ✅ F2.4 reorder 中途撞 agents_order_idx → 缺测试（实现用两阶段避开，需测试证明）
- ✅ F3.5 timeline_one_now_idx 部分唯一 → 缺测试（TEST-STRATEGY.md L2 列出但未实现）
- ✅ F4.5 资产引用拒绝删除 → 已测
- ✅ F5.5 失效 cookie 不应死循环 → 已测（smoke F10）
- ✅ F10.1 uploads 路径穿越 → 已测
- ✅ F10.3 audit 写入失败不应阻断主流程（容错） → 缺测试

### 3.3 风险（受保护价值 + 暴露位置 + 连续失败机制）
- **数据丢失**：删除文章未级联清 asset_links → 当前实现 essays FK onDelete set null 资产 ogImage，但 asset_links 无 FK 串联清理（实现是查 assetLinks 表，essay 删除后 link 孤儿）→ 风险测试可选
- **排序错乱**：reorderAgents 若并发触发会撞唯一索引（实现已两阶段避开，需用例证明）
- **session 劫持**：cookie httpOnly + secure + sameSite=lax（生产）→ 已实现，无显式测试但 cookie 属性是配置正确性问题
- **审计丢失**：writeAuditLog try-catch 吞错 → 风险：DB 故障时审计静默丢失 → 需测容错路径

---

## 4. 本轮新增用例计划

### 4.1 L1 单元（补 8 个文件，约 60 用例）

| 新文件 | 覆盖功能点 | 关键用例 |
|--------|-----------|---------|
| `tests/unit/actions/essays.test.ts` | F1.1–F1.11 | 创建/更新/发布/归档/恢复/删除/批量/历史恢复/SN 唯一冲突/audit 写入（mock DB + mock session） |
| `tests/unit/actions/agents.test.ts` | F2.1–F2.6 | 创建（order 自增）/更新/删除/reorder 两阶段/SN 唯一/status 守卫 |
| `tests/unit/actions/timeline.test.ts` | F3.1–F3.5（已部分） | 扩展：创建取消其他 NOW / setAsNow / 删除 / DB 部分唯一索引 mock |
| `tests/unit/actions/site-config.test.ts` | F7.1/F7.2 | 更新写入 + audit metadata.fields + 未登录拒 |
| `tests/unit/actions/tags.test.ts` | F8.1 | 合并标签去重 / 同名返回 0 / 空值抛 INVALID_INPUT |
| `tests/unit/actions/agent-screenshots.test.ts` | F4.6 | link/unlink/reorder + maxOrder 自增 + 未登录拒 |
| `tests/unit/lib/audit.test.ts` | F10.3 | 正常写入 / DB 失败吞错不抛 |
| `tests/unit/lib/queries-site.test.ts` | queries | getHomeEssays(lang filter) / getHomeAgents(archived filter) / getSiteStats / getEssayBySlug |

**策略**：actions 用 mock（vi.mock("@/lib/db") + vi.mock("@/lib/auth") + vi.mock("@/lib/audit")）→ 证明调用契约与守卫；DB 真行为下沉到 L2。

### 4.2 L2 集成（补 3 个文件，约 25 用例）

| 新文件 | 覆盖功能点 | 关键用例 |
|--------|-----------|---------|
| `tests/integration/essays-crud.test.ts` | F1.1–F1.10 | 真实 PGlite：全状态机 + SN 唯一冲突 + Slug 唯一冲突 + translationGroupId 关联 + revision 行动序列 + audit 行 |
| `tests/integration/agents-reorder.test.ts` | F2.4/F2.5/F3.5 | 真实 PGlite：reorder 两阶段不撞 agents_order_idx / SN 唯一 / setAsNow 取消其他 + 部分唯一索引守卫 |
| `tests/integration/site-config-tags.test.ts` | F7.1/F7.2/F8.1 | 真实 PGlite：updateSiteConfig 写入 + mergeTopicTag 影响多文章 |

### 4.3 L3 Playwright（保留现有 8 spec，不新增）
- 现有 8 spec 已覆盖 B1/B2/B7/B10/B11/B19/B20 主路径
- 不新增：B5 Timeline NOW（L2 已覆盖 DB 不变量）/ B6 资产（L2 已覆盖）/ B12 站点设置（L2 覆盖）→ 避免与 L2 重复，符合 skill「跨层用例必须检出新的故障机制」

---

## 5. 设计门待决议项

### 5.1 关键决策（请批准）
- **D1 范围**：补 L1 8 文件 + L2 3 文件，跑全部现有 + 新增用例出证据。（替代方案：A=只跑现有不补；B=按 TEST-STRATEGY.md 补到 800+ 用例，不现实）
- **D2 L1 actions 策略**：用 mock 证明契约（DB 真行为由 L2 兜底）。（替代：用真实 PGlite，但与 L2 重复）
- **D3 L3 跑否**：跑现有 8 spec 出证据（需启 dev server，约 5–10 分钟）。（替代：跳过 L3 仅引用 test-results/ 历史证据，但 skill 要求「实际执行」才算证据）
- **D4 阈值**：本轮先不动 vitest.config.ts 阈值（85% 行）；报告里说明剩余覆盖差距，避免阻塞 PR。
- **D5 临时改动**：本轮新增测试文件 + docs/testing/ 文档；不修改业务代码（除非测试发现 bug 再议）。

### 5.2 阻断条件
- 若 L2 集成测试发现 DB 行为与代码假设不符（如部分唯一索引未生效）→ 阻断，回到设计门
- 若 Playwright 启动失败（dev server 起不来）→ 阻断 L3，仅出 L1+L2 证据并说明

---

## 6. 验证完成的判据
- ✅ 全部 L1 单元（含新增）通过
- ✅ 全部 L2 集成（含新增）通过
- ✅ 全部 L3 Playwright（现有 8 spec）通过
- ✅ smoke 10 用例通过
- ✅ 关键功能点 F1–F11 在三层中至少一层有证据
- ✅ 关键不变量（SN/Slug/order/timeline_one_now 唯一性）有真实 DB 用例证明
- ✅ 关键守卫（路径穿越、middleware 死循环、资产引用）有真实用例证明
- ✅ 输出 `test-results.json` 含目标版本、环境、每用例结果、证据
- ✅ 报告剩余风险与未覆盖项

---

## 7. 时间预算
- 写 L1 8 文件（约 60 用例）：~ 2 小时
- 写 L2 3 文件（约 25 用例）：~ 1.5 小时
- 跑 L1+L2+smoke（含 debug）：~ 30 分钟
- 跑 Playwright 全量：~ 10 分钟
- 整改 + 复验：~ 1 小时
- 合计：~ 5–6 小时

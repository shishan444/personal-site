# ATELIER · Next.js 工程

> 个人网站 · AI Agent 创作工坊 · 阶段二开发中

子任务编号：**2.1 项目初始化与脚手架**

## 快速开始

```bash
pnpm install
cp .env.example .env.local   # 填入本地配置
pnpm dev                     # 启动开发服务器 → http://localhost:3000
```

## 脚本

| 命令 | 用途 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm start` | 启动生产服务器（先 build） |
| `pnpm type-check` | TypeScript 类型检查 |
| `pnpm lint` | Biome 静态检查 |
| `pnpm lint:fix` | Biome 静态检查 + 自动修复 |
| `pnpm format` | Biome 格式化 |
| `pnpm test` | 运行单元测试（Vitest） |
| `pnpm test:unit` | 单元测试 + 覆盖率 |
| `pnpm test:unit:watch` | 单元测试 watch 模式 |
| `pnpm prepare` | 安装 Husky git hooks |

## 技术栈

- Next.js 14（App Router）+ React 18
- TypeScript 5
- Tailwind CSS 4（@theme + @import "tailwindcss"）
- Biome 2（lint + format，替代 ESLint）
- Husky + lint-staged（git pre-commit）
- Vitest 4 + @testing-library/react + jsdom（单元测试）

## 目录结构

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/           # i18n 子路径（2.5 接入）
│   │   ├── (site)/         # 前台路由组
│   │   └── admin/          # 后台路由组（2.9 接入）
│   ├── api/                # API 路由
│   ├── layout.tsx
│   ├── page.tsx            # 占位首页 "Hello Atelier"
│   └── globals.css         # Tailwind 4 + ATELIER 设计 token
├── components/             # 组件库
│   ├── ui/                 # shadcn/ui 基础组件（2.5 接入）
│   ├── site/               # 前台专用组件
│   ├── admin/              # 后台专用组件
│   └── shared/             # 跨端共享
├── lib/                    # 业务逻辑（actions / db / auth / i18n / utils）
├── hooks/                  # React Hooks
├── messages/               # i18n 文案（2.5 接入）
└── types/                  # 共享 TS 类型

drizzle/                    # Drizzle ORM Migration（2.2 接入）
tests/                      # 5 层测试（unit/integration/e2e/performance/ai）
public/                     # 静态资源
uploads/                    # 用户上传（2.4 接入，gitignore）
scripts/                    # 运维脚本（备份/部署，2.12 接入）
```

## 阶段二进度

- [x] 2.1 项目初始化与脚手架
- [ ] 2.2 数据库与 Schema 实施
- [ ] 2.3 认证与权限
- [ ] 2.4 文件上传与资产管理
- [ ] 2.5 i18n 与设计系统组件库
- [ ] 2.6 前台核心机制
- [ ] 2.7 前台 5 章节实现
- [ ] 2.8 前台详情页与辅助功能
- [ ] 2.9 后台框架与仪表盘
- [ ] 2.10 后台文章与 Agent 管理
- [ ] 2.11 后台其他模块
- [ ] 2.12 SEO + 性能 + 测试 + 部署

详见 `../ROADMAP.md` 与 `../TEST-STRATEGY.md`。

# ATELIER · 部署指南

> 简版部署：DB + 工程 + uploads 目录 + 手动 SQL dump 备份
> 目标：单台 VPS（Ubuntu 22.04）+ 自管 PostgreSQL + PM2 + Nginx + Certbot

## 前置条件

- VPS：阿里云/腾讯云轻量 2C4G+（推荐 4C8G）
- 系统：Ubuntu 22.04 LTS
- 域名：`atelier.com`（已备案）
- 本地：SSH key + `pnpm` 已装

## 1. 服务器初始化（一次性）

```bash
# SSH 登录
ssh root@your-server-ip

# 安装系统包
apt update && apt upgrade -y
apt install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw git

# 安装 Node.js 20 + pnpm
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pnpm pm2

# 防火墙
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# PostgreSQL
systemctl enable postgresql
systemctl start postgresql
sudo -u postgres psql <<'SQL'
CREATE USER atelier WITH PASSWORD 'CHANGE_ME_STRONG';
CREATE DATABASE atelier OWNER atelier;
\c atelier
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SQL
```

## 2. 拉代码 + 初始化

```bash
mkdir -p /var/atelier
cd /var/atelier
git clone <repo-url> app
cd app

# 环境变量
cp .env.example .env.local
# 编辑 .env.local:
#   DATABASE_URL=postgresql://atelier:CHANGE_ME@localhost:5432/atelier
#   AUTH_SECRET=<openssl rand -hex 32>
#   APP_URL=https://atelier.com
#   UPLOAD_DIR=/var/atelier/app/uploads

# 安装 + 跑 migration + seed
pnpm install
pnpm db:migrate
pnpm db:seed

# 构建
pnpm build
```

## 3. PM2 启动

```bash
cp deploy/ecosystem.config.cjs /var/atelier/
cd /var/atelier
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd
# 按提示执行返回的 sudo env... 命令
```

## 4. Nginx 配置

```bash
cp deploy/nginx-atelier.conf /etc/nginx/sites-available/atelier.conf
ln -s /etc/nginx/sites-available/atelier.conf /etc/nginx/sites-enabled/
# 编辑 atelier.conf 把 server_name 改成你的域名
nginx -t && systemctl reload nginx
```

## 5. HTTPS（Let's Encrypt）

```bash
certbot --nginx -d atelier.com -d www.atelier.com
# 自动续期已配
```

## 6. 备份 + DR

### 自动备份（crontab）

```bash
# 每天 03:00 备份到 ./backups/YYYYMMDD-HHMMSS
crontab -e
0 3 * * * cd /var/atelier/app && ./scripts/backup.sh >> /var/log/atelier/backup.log 2>&1
```

### DR 演练（每月一次）

```bash
# 在测试机上
./scripts/restore-db.sh <version>
# 验证：
#   - 数据完整（SELECT count(*) FROM essays）
#   - uploads 文件存在
#   - 应用启动正常
```

### 关键指标

| 指标 | 目标 |
|------|------|
| 备份完成 | < 30 分钟（500 MB DB） |
| 恢复完成 | < 60 分钟 |
| RPO | 24 小时（每日备份） |
| RTO | 4 小时 |

## 7. 日常运维

```bash
# 看日志
pm2 logs atelier
tail -f /var/log/nginx/access.log

# 重启应用
pm2 restart atelier

# 部署新版本
./scripts/deploy.sh
```

## 8. 性能 baseline

| 指标 | 目标 |
|------|------|
| 首页 Lighthouse（PC） | ≥ 90 |
| 首页 Lighthouse（移动） | ≥ 85 |
| 文章详情页 | ≥ 85 |
| /api/upload（10MB） | < 5 秒 |
| 滚动联动 fps | ≥ 55 |
| Bundle first load | < 200 KB |

## 9. 故障排查

| 症状 | 排查 |
|------|------|
| 502 Bad Gateway | PM2 没跑：`pm2 status` |
| 500 Server Error | 看日志：`pm2 logs atelier --lines 100` |
| DB 连接失败 | 检查 DATABASE_URL + PostgreSQL 状态 |
| 上传失败 | 检查 uploads 目录权限 + nginx client_max_body_size |
| 备份失败 | 磁盘满？`df -h` |

---

详见 ARCHITECTURE.md（项目根目录）。

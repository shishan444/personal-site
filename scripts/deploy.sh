#!/usr/bin/env bash
# 部署脚本：拉新代码 → 备份 → 跑 migration → 重启 PM2
set -euo pipefail

APP_DIR="${APP_DIR:-/var/atelier/app}"
PM2_NAME="${PM2_NAME:-atelier}"

cd "${APP_DIR}"
echo "[deploy] pulling latest..."
git pull origin main

echo "[deploy] installing deps..."
pnpm install --frozen-lockfile --prod=false

echo "[deploy] backup before migration..."
VERSION="pre-$(git rev-parse --short HEAD)"
./scripts/backup.sh "${VERSION}"

echo "[deploy] running migration..."
pnpm db:migrate

echo "[deploy] building..."
pnpm build

echo "[deploy] restarting PM2..."
pm2 restart "${PM2_NAME}" --update-env

echo "[deploy] ✅ deployed $(git rev-parse --short HEAD)"

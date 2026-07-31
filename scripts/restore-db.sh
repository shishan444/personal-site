#!/usr/bin/env bash
# 从备份恢复 PostgreSQL 数据库
# 用法: ./scripts/restore-db.sh vX.Y
set -euo pipefail

VERSION="${1:-}"
if [ -z "${VERSION}" ]; then
  echo "Usage: $0 <version>"
  echo "Available versions:"
  ls -1 ./backups/ 2>/dev/null || echo "(no backups)"
  exit 1
fi

BACKUP_DIR="./backups/${VERSION}"
if [ ! -d "${BACKUP_DIR}" ]; then
  echo "ERROR: backup ${BACKUP_DIR} not found"
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL not set"
  exit 1
fi

echo "[restore] from ${BACKUP_DIR} → ${DATABASE_URL%%\?*}"

if [ -f "${BACKUP_DIR}/db.sql.gz" ]; then
  echo "[restore] applying db.sql.gz..."
  gunzip -c "${BACKUP_DIR}/db.sql.gz" | psql "${DATABASE_URL}" --quiet
  echo "[restore] ✓ db restored"
fi

if [ -f "${BACKUP_DIR}/uploads.tar.gz" ]; then
  echo "[restore] extracting uploads..."
  mkdir -p ./uploads
  tar -xzf "${BACKUP_DIR}/uploads.tar.gz -C ./uploads"
  echo "[restore] ✓ uploads restored"
fi

echo "[restore] ✅ complete"

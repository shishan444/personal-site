#!/usr/bin/env bash
# 备份 PostgreSQL 数据库 + uploads 目录
# 用法: ./scripts/backup.sh vX.Y
set -euo pipefail

VERSION="${1:-$(date +%Y%m%d-%H%M%S)}"
BACKUP_DIR="./backups/${VERSION}"
mkdir -p "${BACKUP_DIR}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL not set"
  exit 1
fi

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "[backup] starting ${TIMESTAMP} → ${BACKUP_DIR}"

# 1. SQL dump
echo "[backup] dumping SQL..."
pg_dump "${DATABASE_URL}" --no-owner --no-privileges --format=plain \
  | gzip > "${BACKUP_DIR}/db.sql.gz"
echo "[backup] ✓ db.sql.gz ($(du -h "${BACKUP_DIR}/db.sql.gz" | cut -f1))"

# 2. uploads 目录（如果存在）
if [ -d "./uploads" ]; then
  echo "[backup] tar uploads/..."
  tar -czf "${BACKUP_DIR}/uploads.tar.gz -C ./uploads ."
  echo "[backup] ✓ uploads.tar.gz ($(du -h "${BACKUP_DIR}/uploads.tar.gz" | cut -f1))"
fi

# 3. 元数据
cat > "${BACKUP_DIR}/MANIFEST.txt" <<EOF
ATELIER BACKUP
version: ${VERSION}
created_at: ${TIMESTAMP}
database: ${DATABASE_URL%%\?*}
files: $(ls -1 "${BACKUP_DIR}" | wc -l | tr -d ' ')
EOF

echo "[backup] ✅ complete: ${BACKUP_DIR}"
ls -la "${BACKUP_DIR}"

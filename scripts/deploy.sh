#!/usr/bin/env bash
# Deploy OpenDataCompare to the Hetzner VPS (Tailscale + PM2).
#
# Defaults match hetzner-zeehn. Override via environment:
#   VPS_HOST  VPS_USER  SSH_PORT  REMOTE_DIR  SSH_IDENTITY_FILE
#
# Local (root SSH):  ./scripts/deploy.sh
# CI (deploy user):  VPS_USER=deploy SSH_IDENTITY_FILE=... ./scripts/deploy.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VPS_HOST="${VPS_HOST:-100.108.79.98}"
VPS_USER="${VPS_USER:-root}"
SSH_PORT="${SSH_PORT:-2222}"
REMOTE_DIR="${REMOTE_DIR:-/home/deploy/opendatacompare}"
APP_USER="${APP_USER:-deploy}"

SSH_BASE=(-p "$SSH_PORT" -o StrictHostKeyChecking=accept-new)
if [[ -n "${SSH_IDENTITY_FILE:-}" ]]; then
  SSH_BASE+=(-i "$SSH_IDENTITY_FILE")
fi

RSYNC_SSH="ssh ${SSH_BASE[*]}"
TARGET="${VPS_USER}@${VPS_HOST}"

echo "→ Syncing to ${TARGET}:${REMOTE_DIR}"
rsync -avz --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  -e "$RSYNC_SSH" \
  "${ROOT_DIR}/" "${TARGET}:${REMOTE_DIR}/"

echo "→ Building and restarting PM2"
ssh "${SSH_BASE[@]}" "$TARGET" bash -s <<EOF
set -euo pipefail
REMOTE_DIR="${REMOTE_DIR}"
APP_USER="${APP_USER}"
VPS_USER="${VPS_USER}"

if [[ "\$VPS_USER" == "root" ]]; then
  chown -R "\${APP_USER}:\${APP_USER}" "\${REMOTE_DIR}"
  RUN_AS=(sudo -u "\${APP_USER}")
else
  RUN_AS=()
fi

"\${RUN_AS[@]}" bash -lc "
  set -euo pipefail
  cd '\${REMOTE_DIR}'
  npm ci
  npm run build
  if pm2 describe opendatacompare >/dev/null 2>&1; then
    pm2 restart opendatacompare
  else
    pm2 start ecosystem.config.cjs
  fi
  pm2 save
"

cd "\${REMOTE_DIR}"
bash scripts/sync-caddy.sh
EOF

echo "✓ Deployed https://opendatacompare.com"

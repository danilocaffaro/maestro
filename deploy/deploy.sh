#!/bin/bash
# Deploy Maestro to Oracle VM
# Run from local machine (Mac)

set -e

REMOTE="oracle"  # SSH config alias for Oracle VM
REMOTE_DIR="/home/opc/maestro"

echo "=== Deploying Maestro ==="

# 1. Build locally
echo "Building..."
cd ~/Projects/agent-orchestrator
npm run build

# 2. Sync standalone build + static files
echo "Syncing to $REMOTE..."
rsync -avz --delete \
  .next/standalone/ \
  $REMOTE:$REMOTE_DIR/ \
  --exclude node_modules/.cache

# 3. Copy static assets (Next.js standalone doesn't include them)
rsync -avz .next/static/ $REMOTE:$REMOTE_DIR/.next/static/
rsync -avz public/ $REMOTE:$REMOTE_DIR/public/ 2>/dev/null || true

# 4. Copy native modules (better-sqlite3 needs to be built on target)
ssh $REMOTE "cd $REMOTE_DIR && npm install better-sqlite3 --build-from-source 2>/dev/null || true"

# 5. Copy deploy configs
rsync -avz deploy/ecosystem.config.js $REMOTE:$REMOTE_DIR/

# 6. Restart on remote
echo "Restarting..."
ssh $REMOTE "cd $REMOTE_DIR && pm2 restart maestro 2>/dev/null || pm2 start ecosystem.config.js"

echo ""
echo "=== Deploy complete ==="
echo "Access at: https://maestro.melhor.dev"

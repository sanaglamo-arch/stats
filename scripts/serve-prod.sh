#!/usr/bin/env bash
# Keep the FootyCompare prod server alive on 0.0.0.0:3000.
# Restarts `next start` if it ever exits, so http://82.21.92.176:3000/ stays up.
set -u
cd "$(dirname "$0")/.." || exit 1
LOG=/tmp/footy-server.log
echo "[serve-prod] supervisor starting $(date -u +%FT%TZ)" >> "$LOG"
while true; do
  echo "[serve-prod] launching next start on 0.0.0.0:3000 $(date -u +%FT%TZ)" >> "$LOG"
  NODE_OPTIONS=--max-old-space-size=1024 node node_modules/next/dist/bin/next start -H 0.0.0.0 -p 3000 >> "$LOG" 2>&1
  echo "[serve-prod] next start exited ($?), restarting in 2s $(date -u +%FT%TZ)" >> "$LOG"
  sleep 2
done

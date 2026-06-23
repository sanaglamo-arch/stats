#!/usr/bin/env bash
# OS-level watchdog (runs from cron every minute) — independent of the agent
# loop AND of the pm2 daemon surviving. If the live site does not return HTTP
# 200, it (re)creates the `footy` pm2 process pointing at the production build.
# Root cause it guards against: the pm2 daemon getting OOM-killed on this tight
# box, which drops `footy` from the process list (no auto-respawn).
set -u
export PATH="/opt/node20/bin:$PATH"
APP_DIR="/root/footycompare"
LOG="/root/.pm2/footy-watchdog.log"

code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 http://127.0.0.1:3000/ 2>/dev/null)
if [ "$code" = "200" ]; then
  exit 0
fi

ts=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$ts] site returned '$code' — reaping stray chrome + (re)starting footy" >>"$LOG"

# Reap leftover headless chrome (the /api/card render leak that drives OOM).
pkill -9 -f 'chrome' 2>/dev/null || true

cd "$APP_DIR" || exit 1
# If footy is registered with pm2, a restart is enough; otherwise recreate it.
if pm2 describe footy >/dev/null 2>&1; then
  pm2 restart footy >>"$LOG" 2>&1
else
  pm2 start ./node_modules/next/dist/bin/next --name footy --interpreter node \
    --cwd "$APP_DIR" -- start -p 3000 -H 0.0.0.0 >>"$LOG" 2>&1
  pm2 save >>"$LOG" 2>&1
fi

sleep 5
code2=$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 http://127.0.0.1:3000/ 2>/dev/null)
echo "[$ts] after restart: '$code2'" >>"$LOG"

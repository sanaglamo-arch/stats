#!/usr/bin/env bash
#
# FootyCompare health watchdog.
#
# pm2 auto-restarts on a CRASH, but not on a HANG: the process can stay "online"
# in `pm2 list` while the server stops answering requests (event-loop stall,
# wedged keep-alive, etc.). This probe pings the live site and, if it does not
# return HTTP 200 within a short timeout, restarts the pm2 app to recover.
#
# Invoked every ~2 minutes by footy-healthcheck.timer (this box has no cron
# daemon, so a systemd timer drives it — mirrors footy-refresh.timer). Logs only
# when something is wrong, to avoid spamming the log on every healthy tick.
#
set -u

PM2=/opt/node20/bin/pm2
URL=http://127.0.0.1:3000/
LOG=/root/.footy-healthcheck.log
APP=footy
TIMEOUT=6

ts() { date '+%Y-%m-%dT%H:%M:%S%z'; }

# Print the HTTP status code, or empty string on timeout / connection failure.
probe() { curl -s -m "$TIMEOUT" -o /dev/null -w '%{http_code}' "$URL" 2>/dev/null; }

code=$(probe)
if [ "$code" = "200" ]; then
  exit 0
fi

# One retry to avoid restarting on a transient blip.
sleep 3
code2=$(probe)
if [ "$code2" = "200" ]; then
  echo "$(ts) transient non-200 (got '${code:-timeout}') recovered on retry" >> "$LOG"
  exit 0
fi

echo "$(ts) UNHEALTHY (got '${code:-timeout}' then '${code2:-timeout}') — recovering $APP" >> "$LOG"
export PM2_HOME=/root/.pm2

# Tier 1: plain restart. Works for a hang where pm2 still tracks the process.
"$PM2" restart "$APP" --update-env >> "$LOG" 2>&1
echo "$(ts) restart issued (exit $?)" >> "$LOG"

# Tier 2: pm2 may have LOST the process entirely (not in `pm2 list` anymore) —
# then `restart` is a no-op/error and the site stays down. Re-probe; if still
# unhealthy, start a fresh instance from scratch and persist it.
sleep 4
code3=$(probe)
if [ "$code3" != "200" ]; then
  echo "$(ts) still '${code3:-timeout}' after restart — starting fresh $APP" >> "$LOG"
  cd /root/footycompare || exit 1
  "$PM2" start ./node_modules/next/dist/bin/next --name "$APP" --interpreter node -- start -p 3000 -H 0.0.0.0 >> "$LOG" 2>&1
  echo "$(ts) fresh start issued (exit $?)" >> "$LOG"
  "$PM2" save >> "$LOG" 2>&1
fi

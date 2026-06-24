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

echo "$(ts) UNHEALTHY (got '${code:-timeout}' then '${code2:-timeout}') — restarting $APP" >> "$LOG"
PM2_HOME=/root/.pm2 "$PM2" restart "$APP" --update-env >> "$LOG" 2>&1
echo "$(ts) restart issued (exit $?)" >> "$LOG"

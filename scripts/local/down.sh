#!/usr/bin/env bash
# Stops the local gateway and GoTrue started by up.sh (Postgres is left running).
LOG_DIR="$(cd "$(dirname "$0")/../.." && pwd)/.tmp/logs"
for f in gotrue gateway; do [ -f "$LOG_DIR/$f.pid" ] && kill "$(cat "$LOG_DIR/$f.pid")" 2>/dev/null; rm -f "$LOG_DIR/$f.pid"; done
echo "local gateway and auth stopped"

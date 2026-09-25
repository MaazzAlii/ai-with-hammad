#!/usr/bin/env bash
# Starts the LOCAL test stack: PostgreSQL 16 → real GoTrue → gateway (auth proxy + storage emulator).
# See docs/TESTING.md for how to build GoTrue from source. Paths are configurable:
#   PG_BIN (/usr/lib/postgresql/16/bin)  PGDATA (/var/lib/pgtest/data)  PGPORT (54322)
#   GOTRUE_BIN (/tmp/claude-0/gotrue/auth)  GOTRUE_MIGRATIONS (/tmp/claude-0/gotrue/migrations)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
PGDATA="${PGDATA:-/var/lib/pgtest/data}"
PGPORT="${PGPORT:-54322}"
GOTRUE_BIN="${GOTRUE_BIN:-/tmp/claude-0/gotrue/auth}"
GOTRUE_MIGRATIONS="${GOTRUE_MIGRATIONS:-/tmp/claude-0/gotrue/migrations}"
JWT_SECRET="${JWT_SECRET:-local-dev-jwt-secret-at-least-32-characters-long}"
LOG_DIR="$ROOT/.tmp/logs"
mkdir -p "$LOG_DIR"
PSQL="psql -v ON_ERROR_STOP=1 -q -h 127.0.0.1 -p $PGPORT -U postgres"
export PGOPTIONS='-c client_min_messages=warning'

# 1. Postgres
if ! pg_isready -h 127.0.0.1 -p "$PGPORT" >/dev/null 2>&1; then
  if [ ! -d "$PGDATA" ]; then
    mkdir -p "$(dirname "$PGDATA")" && chown postgres "$(dirname "$PGDATA")"
    su postgres -c "$PG_BIN/initdb -D $PGDATA -U postgres --auth=trust" >/dev/null
  fi
  su postgres -c "$PG_BIN/pg_ctl -D $PGDATA -l $(dirname "$PGDATA")/pg.log -o '-p $PGPORT -k $(dirname "$PGDATA")' start" >/dev/null
  sleep 2
fi

# 2. Reset database when RESET=1 (E2E runs start from a clean slate)
stop_pid() { [ -f "$1" ] && kill "$(cat "$1")" 2>/dev/null; rm -f "$1"; }
if [ "${RESET:-0}" = "1" ]; then
  stop_pid "$LOG_DIR/gotrue.pid"; stop_pid "$LOG_DIR/gateway.pid"; sleep 0.5
  $PSQL -d postgres -c "drop database if exists aiwh_e2e with (force)" -c "create database aiwh_e2e"
fi
DB="${LOCAL_DB:-aiwh_e2e}"
$PSQL -d postgres -tc "select 1 from pg_database where datname='$DB'" | grep -q 1 || $PSQL -d postgres -c "create database $DB"
$PSQL -d "$DB" -f "$ROOT/scripts/local/bootstrap.sql"

# 3. GoTrue (runs its own auth-schema migrations)
export GOTRUE_DB_DRIVER=postgres DB_NAMESPACE=auth
export DATABASE_URL="postgres://supabase_auth_admin:local-only@127.0.0.1:$PGPORT/$DB"
export GOTRUE_DB_MIGRATIONS_PATH="$GOTRUE_MIGRATIONS" GOTRUE_JWT_SECRET="$JWT_SECRET" GOTRUE_JWT_EXP=3600
export GOTRUE_JWT_AUD=authenticated GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated GOTRUE_JWT_ADMIN_ROLES=service_role
export API_EXTERNAL_URL="http://127.0.0.1:54321/auth/v1" GOTRUE_SITE_URL="http://localhost:3000"
export GOTRUE_API_HOST=127.0.0.1 PORT=9999 GOTRUE_MAILER_AUTOCONFIRM=true GOTRUE_DISABLE_SIGNUP=true
export GOTRUE_EXTERNAL_EMAIL_ENABLED=true GOTRUE_LOG_LEVEL=warn
export GOTRUE_RATE_LIMIT_EMAIL_SENT=1000 GOTRUE_RATE_LIMIT_TOKEN_REFRESH=1000 GOTRUE_RATE_LIMIT_VERIFY=1000
"$GOTRUE_BIN" migrate >"$LOG_DIR/gotrue-migrate.log" 2>&1
if ! curl -sf http://127.0.0.1:9999/health >/dev/null; then
  nohup "$GOTRUE_BIN" serve >"$LOG_DIR/gotrue.log" 2>&1 &
  echo $! >"$LOG_DIR/gotrue.pid"
fi

# 4. App schema (canonical setup SQL)
$PSQL -d "$DB" -f "$ROOT/supabase/AI_WITH_HAMAD_SETUP.sql" >/dev/null

# 5. Gateway
if ! curl -sf http://127.0.0.1:54321/health >/dev/null; then
  GATEWAY_DATABASE_URL="postgres://postgres@127.0.0.1:$PGPORT/$DB" JWT_SECRET="$JWT_SECRET" STORAGE_DIR="$ROOT/.tmp/storage" \
    nohup node "$ROOT/scripts/local/supabase-gateway.mjs" >"$LOG_DIR/gateway.log" 2>&1 &
  echo $! >"$LOG_DIR/gateway.pid"
fi
for i in $(seq 1 30); do curl -sf http://127.0.0.1:9999/health >/dev/null && curl -sf http://127.0.0.1:54321/health >/dev/null && break; sleep 0.5; done
echo "local stack ready: db=$DB auth=:9999 gateway=:54321"

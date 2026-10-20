#!/usr/bin/env bash
# One-time (or refresh) setup of the LOCAL ClinicFlow stack for SPDC e2e/QA, in .local-stack/ (gitignored).
# Read-only towards D:\ClinicFlow: exports committed HEAD with `git archive`, never touches that working tree.
# Needs: Git Bash, Java 21, Node 20+, Python 3, PostgreSQL binaries (PG_BIN), Chrome (for QA scripts).
# Usage: bash scripts/local-stack/setup.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STACK="$ROOT/.local-stack"
CORE="${CORE_DIR:-/d/ClinicFlow}"
PG_BIN="${PG_BIN:-/c/Program Files/PostgreSQL/18/bin}"
PG_PORT="${PG_PORT:-55433}"
mkdir -p "$STACK"
cd "$STACK"

echo "1/5 export core HEAD from $CORE"
rm -rf clinicflow-api clinicflow-frontend
git -C "$CORE/clinicflow-api" archive --format=tar --prefix=clinicflow-api/ HEAD | tar -x
git -C "$CORE/clinicflow-frontend" archive --format=tar --prefix=clinicflow-frontend/ HEAD | tar -x
printf '%s\n' "clinicflow-api $(git -C "$CORE/clinicflow-api" rev-parse --short HEAD)" "clinicflow-frontend $(git -C "$CORE/clinicflow-frontend" rev-parse --short HEAD)" > CORE_VERSIONS.txt

echo "2/5 throwaway Postgres cluster on :$PG_PORT (trust auth, localhost only)"
if [ ! -d pgdata ]; then
  "$PG_BIN/initdb.exe" -D pgdata -U postgres --auth=trust -E UTF8 --locale=C > initdb.log
  "$PG_BIN/pg_ctl.exe" -D pgdata -o "-p $PG_PORT -c listen_addresses=localhost" -l pg.log start
  sleep 3
  "$PG_BIN/psql.exe" -h localhost -p "$PG_PORT" -U postgres -c "create database clinic_flow"
fi

echo "3/5 build the API jar"
(cd clinicflow-api && ./mvnw -q -DskipTests package)

echo "4/5 core frontend: exact locked deps, pointed at the LOCAL API only"
cd clinicflow-frontend
npm ci --no-audit --no-fund
printf 'NEXT_PUBLIC_API_URL=http://localhost:8089/api/v1\n' > .env.production.local
printf 'NEXT_PUBLIC_API_URL=http://localhost:8089/api/v1\n' > .env.local
# --no-lint: core HEAD has lint errors that fail `next build` (reported to the ClinicFlow team; not fixed here).
NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next build --no-lint
cd ..

echo "5/5 done. Next: bash scripts/local-stack/start.sh, then node scripts/local-stack/seed.mjs"

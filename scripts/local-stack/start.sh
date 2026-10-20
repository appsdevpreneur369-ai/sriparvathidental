#!/usr/bin/env bash
# Starts the LOCAL stack (after setup.sh): Postgres :55433, ClinicFlow API :8089, branded portal :3301, SPDC site :3300.
# Logs in .local-stack/*.log. Stop with: bash scripts/local-stack/stop.sh
# Usage: bash scripts/local-stack/start.sh [--prod]   (--prod serves the site's production build instead of `next dev`)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STACK="$ROOT/.local-stack"
PG_BIN="${PG_BIN:-/c/Program Files/PostgreSQL/18/bin}"
PG_PORT="${PG_PORT:-55433}"
cd "$STACK"

"$PG_BIN/pg_ctl.exe" -D pgdata status > /dev/null 2>&1 || "$PG_BIN/pg_ctl.exe" -D pgdata -o "-p $PG_PORT -c listen_addresses=localhost" -l pg.log start

# A fresh random JWT secret per start (local only): existing sessions simply log in again.
JWT="$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")"
nohup java -jar clinicflow-api/target/clinicflow-api-0.0.1-SNAPSHOT.jar \
  --server.port=8089 \
  --spring.datasource.url="jdbc:postgresql://localhost:$PG_PORT/clinic_flow" \
  --spring.datasource.username=postgres --spring.datasource.password=postgres \
  --spring.jpa.show-sql=false \
  --app.jwt.secret="$JWT" \
  --app.cors.allowed-origins=http://localhost:3300,http://localhost:3301,http://spdc.localhost:3301 \
  --app.frontend-url=http://localhost:3301 --app.base-url=http://localhost:3301 \
  --app.email.enabled=false > api.log 2>&1 &
echo "API starting (log: .local-stack/api.log) — email/SMS/WhatsApp are OFF (dry-run, OTP 123456)"
until grep -qE "Started ClinicflowApplication|APPLICATION FAILED" api.log 2>/dev/null; do sleep 2; done
grep -q "Started ClinicflowApplication" api.log || { echo "API failed — see .local-stack/api.log"; exit 1; }

(cd clinicflow-frontend && nohup ./node_modules/.bin/next start -p 3301 > ../portal.log 2>&1 &)
cd "$ROOT"
if [ "${1:-}" = "--prod" ]; then
  nohup npx next start -p 3300 > .local-stack/site.log 2>&1 &
else
  nohup npx next dev -p 3300 > .local-stack/site.log 2>&1 &
fi
sleep 8
cat <<EOF

Local stack is up:
  SPDC website ............ http://localhost:3300
  SPDC-branded portal ..... http://spdc.localhost:3301   (white-label host; staff and patient sign-in)
  ClinicFlow API .......... http://localhost:8089/api/v1
Test logins: .local-stack/test-logins.json (run node scripts/local-stack/seed.mjs first)
EOF

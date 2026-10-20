#!/usr/bin/env bash
# Stops the LOCAL stack started by start.sh: whatever listens on :3300, :3301, :8089, then the throwaway Postgres.
# Only touches those ports and .local-stack/pgdata.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PG_BIN="${PG_BIN:-/c/Program Files/PostgreSQL/18/bin}"
for port in 3300 3301 8089; do
  powershell.exe -NoProfile -Command "\$p = (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique; foreach (\$x in \$p) { Stop-Process -Id \$x -Confirm:\$false; 'stopped :$port (pid ' + \$x + ')' }"
done
"$PG_BIN/pg_ctl.exe" -D "$ROOT/.local-stack/pgdata" stop -m fast

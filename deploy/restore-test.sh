#!/usr/bin/env sh
# Restores into a NEW database only. Never overwrites production.
set -eu
cd "$(dirname "$0")"
[ "$#" -eq 1 ] || { printf 'Usage: ./restore-test.sh backups/file.dump\n'; exit 1; }
restore_db="plp_restore_$(date -u +%Y%m%d%H%M%S)"
docker compose --env-file "${ENV_FILE:-.env}" -f compose.yml exec -T database createdb -U plp "$restore_db"
docker compose --env-file "${ENV_FILE:-.env}" -f compose.yml exec -T database pg_restore -U plp -d "$restore_db" --exit-on-error < "$1"
docker compose --env-file "${ENV_FILE:-.env}" -f compose.yml exec -T database psql -U plp -d "$restore_db" -c 'SELECT count(*) AS users FROM users; SELECT count(*) AS certificates FROM certificates;'
printf 'Verified restore database: %s. Remove it after inspection.\n' "$restore_db"

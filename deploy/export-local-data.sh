#!/usr/bin/env sh
# Run on the development computer. Copies the local database into a scratch database, removes the
# demo accounts there (remove-demo-data.sql), and writes the cleaned database and the uploads it still
# uses to deploy/export/. The local database itself is never changed.
set -eu
cd "$(dirname "$0")/.."
out=deploy/export
mkdir -p "$out"
umask 077
db="plp_export_$(date -u +%Y%m%d%H%M%S)"
local_db() { docker compose exec -T database "$@"; }
trap 'local_db dropdb -U plp --if-exists "$db" >/dev/null 2>&1 || true' EXIT HUP INT TERM
local_db createdb -U plp "$db"
local_db pg_dump -U plp -d plp --no-owner --no-privileges | local_db psql -q -U plp -d "$db" -v ON_ERROR_STOP=1 > /dev/null
local_db psql -U plp -d "$db" < deploy/remove-demo-data.sql
local_db pg_dump -U plp -d "$db" --no-owner --no-privileges > "$out/plp.sql"
local_db psql -At -U plp -d "$db" -c "SELECT id FROM files" > "$out/files.txt"
# Only the attachments that real accounts still use are copied.
docker compose exec -T platform sh -c 'cd /app/uploads && while read -r id; do [ -f "$id" ] && echo "$id"; done | tar -czf - -T -' < "$out/files.txt" > "$out/uploads.tar.gz"
printf 'Wrote %s/plp.sql and %s/uploads.tar.gz (%s files).\n' "$out" "$out" "$(tar -tzf "$out/uploads.tar.gz" | wc -l | tr -d ' ')"

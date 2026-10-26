#!/usr/bin/env sh
# Briefly stops writes so the database and attachment archive describe the same state.
set -eu
cd "$(dirname "$0")"
umask 077
mkdir -p backups
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup="backups/plp-$stamp"
compose() { docker compose --env-file "${ENV_FILE:-.env}" -f compose.yml "$@"; }
compose stop platform
trap 'compose start platform' EXIT HUP INT TERM
compose exec -T database pg_dump -U plp -d plp -Fc > "$backup.dump.partial"
compose exec -T database pg_restore --list < "$backup.dump.partial" > /dev/null
compose run --rm --no-deps -T --entrypoint tar platform -C /app/uploads -czf - . > "$backup.files.tar.gz.partial"
tar -tzf "$backup.files.tar.gz.partial" > /dev/null
mv "$backup.dump.partial" "$backup.dump"
mv "$backup.files.tar.gz.partial" "$backup.files.tar.gz"
printf 'Saved %s.dump and %s.files.tar.gz\nCopy both to encrypted storage outside this server.\n' "$backup" "$backup"

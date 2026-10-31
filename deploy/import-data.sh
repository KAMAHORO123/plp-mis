#!/usr/bin/env sh
# Run once on the new server, before the first full start. Loads export/plp.sql into the empty
# production database and unpacks export/uploads.tar.gz into the uploads volume.
set -eu
cd "$(dirname "$0")"
compose() { docker compose --env-file "${ENV_FILE:-.env}" -f compose.yml "$@"; }
[ -f export/plp.sql ] && [ -f export/uploads.tar.gz ] || { printf 'Copy export/plp.sql and export/uploads.tar.gz here first.\n'; exit 1; }
compose up -d --wait database
if [ "$(compose exec -T database psql -At -U plp -d plp -c "SELECT to_regclass('public.users') IS NOT NULL")" = "t" ]; then
  printf 'The production database already has data. Nothing was imported.\n'; exit 1
fi
compose exec -T database psql -q -U plp -d plp -v ON_ERROR_STOP=1 < export/plp.sql > /dev/null
# The platform container drops every privilege, so a plain helper unpacks into its volume (uid 1000 is "node").
compose create platform > /dev/null
docker run --rm -i -v "${COMPOSE_PROJECT_NAME:-plp}_uploads:/uploads" alpine:3.22 sh -c 'tar -xzf - -C /uploads && chown -R 1000:1000 /uploads' < export/uploads.tar.gz
compose exec -T database psql -U plp -d plp -c 'SELECT count(*) AS accounts FROM users; SELECT count(*) AS files FROM files;'
printf 'Imported. Now start everything: docker compose --env-file .env -f compose.yml --profile mail up -d --build\n'

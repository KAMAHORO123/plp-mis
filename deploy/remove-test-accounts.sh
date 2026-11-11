#!/usr/bin/env bash
# Run from the Compose directory. Pass Compose options (for example -f compose.yml) as arguments.
set -euo pipefail
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
result=$(docker compose "$@" exec -T database psql -X -A -t -U plp -d plp < "$script_dir/remove-test-accounts.sql")
printf '%s\n' "$result"
# The SQL emits only UUIDs for files owned by the deleted accounts.
upload_ids=$(printf '%s\n' "$result" | awk '/^[0-9a-f-]+$/ && length($0)==36')
if [[ -n "$upload_ids" ]]; then
  printf '%s\n' "$upload_ids" | docker compose "$@" exec -T platform node --input-type=module -e '
    import { unlink } from "node:fs/promises";
    import path from "node:path";
    let input = "";
    for await (const chunk of process.stdin) input += chunk;
    if (!process.env.UPLOAD_DIR) throw new Error("UPLOAD_DIR is required");
    for (const id of input.trim().split(/\s+/)) {
      if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(id)) throw new Error("Invalid file ID");
      await unlink(path.join(process.env.UPLOAD_DIR, id)).catch(error => { if (error.code !== "ENOENT") throw error; });
      console.log("Removed upload:", id);
    }
  '
fi
docker compose "$@" exec -T database psql -X -v ON_ERROR_STOP=1 -U plp -d plp -c "SELECT count(*) AS remaining_test_accounts FROM users WHERE lower(email) IN ('kelliakamahoro@gmail.com','ileadinitiativeteam@gmail.com','bettyndinabo@gmail.com');"

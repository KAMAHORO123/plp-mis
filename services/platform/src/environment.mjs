import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";

// Shell/container values take precedence. Never load the shareable example file.
export function loadEnvironment(files, target = process.env) {
  for (const file of files) {
    let values;
    try {
      values = parseEnv(readFileSync(file, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    for (const [key, value] of Object.entries(values)) {
      if (target[key] === undefined) target[key] = value;
    }
  }
}
loadEnvironment([
  new URL("../.env", import.meta.url),
  new URL("../../../deploy/.env", import.meta.url),
]);

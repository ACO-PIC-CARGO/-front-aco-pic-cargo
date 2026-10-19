import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { moduleFiles } from "./load-vuex-modules.mjs";

const CLI = fileURLToPath(new URL("./check-vuex-consumers.mjs", import.meta.url));

test("the CLI loads every Vuex module and finishes its scan for a registered key", () => {
  const [key] = Object.keys(moduleFiles());
  const run = spawnSync(process.execPath, [CLI, key], { encoding: "utf8" });
  assert.ok([0, 1].includes(run.status), `exit ${run.status}: ${run.stderr}`);
  assert.doesNotMatch(run.stderr, /^\w*Error\b/m);
});

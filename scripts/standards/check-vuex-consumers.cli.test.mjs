import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const CLI = fileURLToPath(new URL("./check-vuex-consumers.mjs", import.meta.url));

test("the CLI loads every Vuex module and reports the consumers of coins", () => {
  const run = spawnSync(process.execPath, [CLI, "coins"], { encoding: "utf8" });
  assert.equal(run.status, 1, run.stderr);
  assert.match(run.stdout, /^src\/components\/FolderCoins\//m);
});

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const CODEMOD = fileURLToPath(new URL("./vuetify-data-keys.mjs", import.meta.url));

function runCodemod(files) {
  const dir = mkdtempSync(join(tmpdir(), "vuetify-data-keys-"));
  try {
    for (const [name, source] of Object.entries(files)) writeFileSync(join(dir, name), source);
    execFileSync(process.execPath, [CODEMOD, dir]);
    return Object.fromEntries(Object.keys(files).map((name) => [name, readFileSync(join(dir, name), "utf8")]));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const sfc = (template, script) => `<template>\n${template}\n</template>\n<script>\n${script}\n</script>\n`;

test("leaves a hand-built table that prints header.text alone", () => {
  const source = sfc(
    `<table><th v-for="(header, index) in headers" :key="index">{{ header.text }}</th></table>`,
    `export default {
  data: () => ({ headers: [] }),
  methods: {
    build() {
      this.headers = [{ text: "Tarifa", value: "tarifa" }];
    },
  },
};`
  );
  const { "Comparativa.vue": result } = runCodemod({ "Comparativa.vue": source });
  assert.equal(result, source);
});

test("renames the headers of a data table to title and key", () => {
  const source = sfc(
    `<v-data-table :headers="headers" :items="rows" />`,
    `export default { data: () => ({ headers: [{ text: "Tarifa", value: "tarifa" }] }) };`
  );
  const { "List.vue": result } = runCodemod({ "List.vue": source });
  assert.match(result, /headers: \[\{ title: "Tarifa", key: "tarifa" \}\]/);
});

test("still renames headers a data table binds even if a loop also prints header.text", () => {
  const source = sfc(
    `<div><span v-for="header in headers" :key="header.value">{{ header.text }}</span><v-data-table :headers="headers" /></div>`,
    `export default { data: () => ({ headers: [{ text: "Tarifa", value: "tarifa" }] }) };`
  );
  const { "Mixed.vue": result } = runCodemod({ "Mixed.vue": source });
  assert.match(result, /\{ title: "Tarifa", key: "tarifa" \}/);
});

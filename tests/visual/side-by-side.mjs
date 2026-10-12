import { readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const [, , before, after, out] = process.argv;
const link = (dir, name) => relative(out, join(dir, name)).split("\\").join("/");
const rows = readdirSync(before)
  .filter((file) => file.endsWith(".png"))
  .sort()
  .map(
    (name) =>
      `<h2>${name}</h2><div style="display:flex;gap:8px"><img src="${link(before, name)}" width="49%"><img src="${link(after, name)}" width="49%"></div>`
  );
writeFileSync(join(out, "index.html"), `<!doctype html><meta charset="utf-8"><title>Vue 2 vs Vue 3</title>${rows.join("\n")}`);

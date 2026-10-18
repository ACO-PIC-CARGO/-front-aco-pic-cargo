import "./loader/register.mjs";
import { readFileSync } from "node:fs";

globalThis.sessionStorage ??= { getItem: () => "[{}]", setItem() {}, removeItem() {} };

const SRC = new URL("../../src/", import.meta.url);
const MODULE_IMPORT = /^import\s+(\w+)\s+from\s+"\.\/modules\/([^"]+)"/gm;

export function moduleFiles() {
  const index = readFileSync(new URL("store/index.js", SRC), "utf8");
  return Object.fromEntries([...index.matchAll(MODULE_IMPORT)].map(([, key, file]) => [key, `store/modules/${file}.js`]));
}

export async function loadVuexModules() {
  const entries = await Promise.all(
    Object.entries(moduleFiles()).map(async ([key, file]) => {
      const { default: mod } = await import(new URL(file, SRC).href);
      return [key, {
        key,
        namespaced: mod.namespaced === true,
        actions: Object.keys(mod.actions ?? {}),
        mutations: Object.keys(mod.mutations ?? {}),
      }];
    }),
  );
  return Object.fromEntries(entries);
}

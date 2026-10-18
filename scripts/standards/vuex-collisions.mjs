import { pathToFileURL } from "node:url";
import { loadVuexModules } from "./load-vuex-modules.mjs";

function sharedNames(modules, kind) {
  const owners = {};
  for (const [key, mod] of Object.entries(modules))
    if (!mod.namespaced) for (const name of mod[kind]) (owners[name] ??= []).push(key);
  return Object.fromEntries(Object.entries(owners).filter(([, keys]) => keys.length > 1));
}

export function collisions(modules) {
  return { actions: sharedNames(modules, "actions"), mutations: sharedNames(modules, "mutations") };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const found = collisions(await loadVuexModules());
  for (const kind of ["actions", "mutations"]) {
    console.log(`# ${kind}: ${Object.keys(found[kind]).length}`);
    for (const [name, keys] of Object.entries(found[kind]).sort(([a], [b]) => a.localeCompare(b)))
      console.log(`${name}: ${keys.join(", ")}`);
  }
}

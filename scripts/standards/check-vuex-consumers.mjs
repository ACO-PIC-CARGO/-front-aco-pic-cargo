import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadVuexModules, moduleFiles } from "./load-vuex-modules.mjs";

const quoted = (name) => `["'\`]${name}["'\`]`;
const MAP_CALL = /map(Actions|Mutations|State|Getters)\(([^)]*)\)/g;

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

function patternsFor({ key, namespaced, actions, mutations }) {
  const patterns = [new RegExp(String.raw`\b(?:state|rootState)\.${key}\b`, "g")];
  if (namespaced) {
    patterns.push(new RegExp(String.raw`["'\`]${key}/`, "g"), new RegExp(String.raw`map(?:State|Getters|Actions|Mutations)\(\s*${quoted(key)}`, "g"));
  } else {
    for (const name of actions) patterns.push(new RegExp(String.raw`dispatch\(\s*${quoted(name)}`, "g"));
    for (const name of mutations) patterns.push(new RegExp(String.raw`commit\(\s*${quoted(name)}`, "g"));
  }
  return patterns;
}

function mapCallIndexes(text, { namespaced, actions, mutations }) {
  if (namespaced) return [];
  const indexes = [];
  for (const call of text.matchAll(MAP_CALL)) {
    const names = call[1] === "Actions" ? actions : call[1] === "Mutations" ? mutations : [];
    for (const name of names) {
      const at = call[2].search(new RegExp(quoted(name)));
      if (at !== -1) indexes.push(call.index + call[0].indexOf(call[2]) + at);
    }
  }
  return indexes;
}

function commentLines(lines) {
  const commented = new Set();
  let inHtml = false;
  lines.forEach((raw, i) => {
    const line = raw.trim();
    const opens = line.startsWith("<!--");
    if (inHtml || opens || ["//", "/*", "*"].some((start) => line.startsWith(start))) commented.add(i + 1);
    if (inHtml || opens) inHtml = line.lastIndexOf("<!--") > line.lastIndexOf("-->") || (inHtml && !line.includes("-->"));
  });
  return commented;
}

export function findConsumers(files, moduleInfo) {
  const patterns = patternsFor(moduleInfo);
  const hits = [];
  for (const [file, text] of Object.entries(files)) {
    const lines = text.split("\n");
    const hitLines = new Set(mapCallIndexes(text, moduleInfo).map((index) => lineOf(text, index)));
    for (const pattern of patterns)
      for (const match of text.matchAll(pattern)) hitLines.add(lineOf(text, match.index));
    const commented = commentLines(lines);
    for (const line of [...hitLines].filter((n) => !commented.has(n)).sort((a, b) => a - b))
      hits.push({ file, line, text: lines[line - 1].trim() });
  }
  return hits;
}

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /.(vue|js|ts)$/.test(entry.name) ? [path] : [];
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const key = process.argv[2];
  const file = moduleFiles()[key];
  if (!file) {
    console.error(`Unknown module key: ${key}`);
    process.exit(2);
  }
  const src = resolve(import.meta.dirname, "../../src");
  const own = resolve(src, file);
  const stores = resolve(src, "stores");
  const files = Object.fromEntries(
    sourceFiles(src)
      .filter((path) => path !== own && !path.startsWith(stores))
      .map((path) => [relative(resolve(src, ".."), path).replaceAll("\\", "/"), readFileSync(path, "utf8")]),
  );
  const hits = findConsumers(files, (await loadVuexModules())[key]);
  for (const hit of hits) console.log(`${hit.file}:${hit.line}: ${hit.text}`);
  process.exit(hits.length ? 1 : 0);
}

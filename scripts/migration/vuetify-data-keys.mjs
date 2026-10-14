import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { babelParse, parse as parseSfc } from "vue/compiler-sfc";

const HEADER_NAME = /^(headers?|cab\w*|encabezados?\w*|columns?)$/i;
const SELECT_TAG = /<(v-select|v-autocomplete|v-combobox)(?=[\s>/])/g;
const HEADERS_BINDING = /(?:^|\s)(?::|v-bind:)headers="([^"]+)"/g;
const V_FOR = /v-for="\(?\s*(\w+)[^"]*\s(?:in|of)\s+([\w.]+)\s*"/g;

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? walk(join(dir, entry.name))
      : [join(dir, entry.name)]
  );

const keyName = (property) =>
  property.key.type === "Identifier" ? property.key.name : property.key.value;

const isHeaderObject = (node) => {
  if (node.type !== "ObjectExpression") return false;
  const properties = node.properties.filter((p) => p.type === "ObjectProperty");
  if (properties.length !== node.properties.length) return false;
  const keys = properties.map(keyName);
  return keys.includes("text") && keys.includes("value");
};

const headerEdits = (node, source) =>
  node.properties.flatMap((property) => {
    const name = keyName(property);
    const valueSource = source.slice(property.value.start, property.value.end);
    const renames = { text: "title", value: "key" };
    if (renames[name]) {
      return [
        property.shorthand
          ? [property.start, property.end, `${renames[name]}: ${valueSource}`]
          : [property.key.start, property.key.end, renames[name]],
      ];
    }
    if (name === "class") {
      return [[property.start, property.end, `headerProps: { class: ${valueSource} }`]];
    }
    if (name === "cellClass") {
      return [[property.start, property.end, `cellProps: { class: ${valueSource} }`]];
    }
    return [];
  });

const ownerName = (node) => {
  if (node.type === "ObjectProperty" || node.type === "ObjectMethod") {
    return node.key && (node.key.name ?? node.key.value);
  }
  if (node.type === "VariableDeclarator") return node.id.name;
  if (node.type === "AssignmentExpression") {
    return node.left.property ? node.left.property.name : node.left.name;
  }
  return undefined;
};

function scriptEdits(source, headerNames, transformedOwners) {
  const ast = babelParse(source, { sourceType: "module" });
  const edits = [];
  const visit = (node, owner) => {
    if (!node || typeof node.type !== "string") return;
    const name = ownerName(node);
    const currentOwner = owner ?? (name !== undefined && headerNames.has(name) ? name : undefined);
    if (currentOwner && isHeaderObject(node)) {
      edits.push(...headerEdits(node, source));
      transformedOwners.add(currentOwner);
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (key === "loc" || key === "leadingComments" || key === "trailingComments") continue;
      if (Array.isArray(child)) child.forEach((item) => visit(item, currentOwner));
      else if (child && typeof child === "object") visit(child, currentOwner);
    }
  };
  visit(ast.program, undefined);
  return edits;
}

function selectEdits(template) {
  const edits = [];
  for (const match of template.matchAll(SELECT_TAG)) {
    let end = match.index;
    let quote = null;
    while (end < template.length) {
      const char = template[end];
      if (quote) {
        if (char === quote) quote = null;
      } else if (char === '"' || char === "'") {
        quote = char;
      } else if (char === ">") {
        break;
      }
      end++;
    }
    const tag = template.slice(match.index, end);
    if (!/(^|\s)(:|v-bind:)?item-(text|title)\b/.test(tag)) {
      const at = match.index + match[0].length;
      edits.push([at, at, ' item-title="text"']);
    }
  }
  return edits;
}

const lastSegment = (expression) => expression.trim().split(".").pop();

function handBuiltHeaderLists(template) {
  const bound = new Set([...template.matchAll(HEADERS_BINDING)].map(([, expression]) => lastSegment(expression)));
  return new Set(
    [...template.matchAll(V_FOR)]
      .filter(([, item, list]) => new RegExp(`\\b${item}\\.text\\b`).test(template) && !bound.has(lastSegment(list)))
      .map(([, , list]) => lastSegment(list))
  );
}

const applyEdits = (source, edits) =>
  [...edits]
    .sort((a, b) => b[0] - a[0])
    .reduce((text, [start, end, replacement]) => text.slice(0, start) + replacement + text.slice(end), source);

const root = process.argv[2] ?? "src";
const files = walk(root).filter((file) => /\.(vue|js)$/.test(file));

const headerNames = new Set();
for (const file of files.filter((f) => f.endsWith(".vue"))) {
  for (const [, expression] of readFileSync(file, "utf8").matchAll(HEADERS_BINDING)) {
    headerNames.add(expression.trim().split(".").pop());
  }
}
for (const name of [...headerNames]) if (!/^\w+$/.test(name)) headerNames.delete(name);
const isHeaderName = { has: (name) => headerNames.has(name) || HEADER_NAME.test(name) };

const transformedOwners = new Set();
let changedFiles = 0;
for (const file of files) {
  const source = readFileSync(file, "utf8");
  let edits = [];
  if (file.endsWith(".vue")) {
    const { descriptor } = parseSfc(source, { filename: file });
    const handBuilt = handBuiltHeaderLists(descriptor.template?.content ?? "");
    const isFileHeaderName = { has: (name) => !handBuilt.has(name) && isHeaderName.has(name) };
    for (const block of [descriptor.script, descriptor.scriptSetup].filter(Boolean)) {
      const offset = block.loc.start.offset;
      edits.push(
        ...scriptEdits(block.content, isFileHeaderName, transformedOwners).map(([s, e, r]) => [s + offset, e + offset, r])
      );
    }
    if (descriptor.template) {
      const offset = descriptor.template.loc.start.offset;
      edits.push(
        ...selectEdits(descriptor.template.content).map(([s, e, r]) => [s + offset, e + offset, r])
      );
    }
  } else {
    edits = scriptEdits(source, isHeaderName, transformedOwners);
  }
  if (!edits.length) continue;
  writeFileSync(file, applyEdits(source, edits));
  changedFiles++;
  console.log(`${file}: ${edits.length} edits`);
}
console.log(`\nChanged ${changedFiles} files.`);
const untouched = [...headerNames].filter((name) => !transformedOwners.has(name));
if (untouched.length) {
  console.log(`:headers bindings with no { text, value } definition left to rename (check by hand): ${untouched.join(", ")}`);
}

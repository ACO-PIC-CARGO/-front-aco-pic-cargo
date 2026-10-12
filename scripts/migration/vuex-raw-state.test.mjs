import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { babelParse, walkIdentifiers } from "vue/compiler-sfc";

const MODULES_DIR = new URL("../../src/store/modules/", import.meta.url);
const MUTATING_METHODS = new Set(["push", "pop", "shift", "unshift", "splice", "sort", "reverse", "fill", "copyWithin"]);
const FUNCTION_TYPES = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression", "ObjectMethod"]);
const MEMBER_TYPES = new Set(["MemberExpression", "OptionalMemberExpression"]);

const declaresModuleState = (program) =>
  program.body.some(
    (statement) =>
      statement.type === "VariableDeclaration" &&
      statement.declarations.some((declarator) => declarator.id.type === "Identifier" && declarator.id.name === "state")
  );

const isWrite = (target, parent) => {
  switch (parent.type) {
    case "AssignmentExpression":
      return parent.left === target;
    case "UpdateExpression":
      return parent.argument === target;
    case "UnaryExpression":
      return parent.operator === "delete" && parent.argument === target;
    case "CallExpression":
    case "OptionalCallExpression":
      if (parent.callee === target) return MEMBER_TYPES.has(target.type) && MUTATING_METHODS.has(target.property.name);
      return parent.callee.type === "MemberExpression" && parent.callee.property.name === "assign" && parent.arguments[0] === target;
    default:
      return false;
  }
};

const enclosingFunctionName = (ancestors) => {
  for (let index = ancestors.length - 1; index >= 0; index--) {
    const node = ancestors[index];
    if (node.type === "FunctionDeclaration") return node.id.name;
    if (node.type === "ObjectMethod" || (node.type === "ObjectProperty" && FUNCTION_TYPES.has(node.value.type))) {
      return node.key.name ?? node.key.value;
    }
  }
  return "<anonymous>";
};

export function findRawStateWrites(source) {
  const program = babelParse(source, { sourceType: "module" }).program;
  if (!declaresModuleState(program)) return [];
  const writes = [];
  walkIdentifiers(program, (identifier, parent, parentStack) => {
    if (identifier.name !== "state" || !parentStack.some((node) => FUNCTION_TYPES.has(node.type))) return;
    const chain = [identifier, ...parentStack.slice().reverse()];
    let depth = 0;
    while (MEMBER_TYPES.has(chain[depth + 1].type) && chain[depth + 1].object === chain[depth]) depth++;
    if (isWrite(chain[depth], chain[depth + 1])) {
      writes.push(`${identifier.loc.start.line} ${enclosingFunctionName(parentStack)}`);
    }
  });
  return writes;
}

test("detector flags writes through the module-level state and ignores the context state", () => {
  const source = `
    const state = { list: [], item: {} };
    const mutations = { setList(state, list) { state.list = list; } };
    const actions = {
      load({ commit }) { state.list = []; state.list.push(1); state.item.count++; delete state.item.x; },
      reload({ state }) { state.list = []; state.list.push(1); },
      read() { return state.list.length; },
    };
    function helper() { Object.assign(state.item, {}); }
  `;
  assert.deepEqual(findRawStateWrites(source), ["5 load", "5 load", "5 load", "5 load", "9 helper"]);
});

for (const file of readdirSync(MODULES_DIR).filter((name) => name.endsWith(".js"))) {
  test(`src/store/modules/${file} writes state only through the action context`, () => {
    assert.deepEqual(findRawStateWrites(readFileSync(new URL(file, MODULES_DIR), "utf8")), []);
  });
}

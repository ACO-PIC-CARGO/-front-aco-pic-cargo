import { test } from "node:test";
import assert from "node:assert/strict";
import { lockModuleInAccess, moduleIdForRoute } from "./plan-access.mjs";

const MENU = [
  { id: 3, name: "Ventas", children: [{ name: "Cotizaciones", children: [{ route: "lstQuote" }] }] },
  { id: 9, name: "Configuración", children: [{ name: "Plan", children: [{ route: "miPlan" }] }] },
];

test("finds the top-level module that contains a route", () => {
  assert.equal(moduleIdForRoute(MENU, "lstQuote"), 3);
});

test("rejects a route that no module contains", () => {
  assert.throws(() => moduleIdForRoute(MENU, "nope"), /No menu module contains route "nope"/);
});

test("locks a module inside the access row of the API response", () => {
  const body = { estadoflag: true, data: [{ has_plan: false, locked_module_ids: [1] }] };
  lockModuleInAccess(body, 3);
  assert.deepEqual(body.data[0], { has_plan: true, locked_module_ids: [1, 3] });
});

test("fails when the response carries no access row", () => {
  assert.throws(() => lockModuleInAccess({ data: [] }, 3), /no plan access row/);
});

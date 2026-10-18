import { test } from "node:test";
import assert from "node:assert/strict";
import { collisions } from "./vuex-collisions.mjs";

test("reports names shared by non-namespaced modules only", () => {
  const modules = {
    a: { namespaced: false, actions: ["load", "save"], mutations: ["SET_X"] },
    b: { namespaced: false, actions: ["load"], mutations: ["SET_X", "SET_Y"] },
    c: { namespaced: true, actions: ["save"], mutations: [] },
  };
  assert.deepEqual(collisions(modules), { actions: { load: ["a", "b"] }, mutations: { SET_X: ["a", "b"] } });
});

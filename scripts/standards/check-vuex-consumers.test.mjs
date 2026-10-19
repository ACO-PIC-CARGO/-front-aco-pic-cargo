import { test } from "node:test";
import assert from "node:assert/strict";
import { findConsumers } from "./check-vuex-consumers.mjs";

const coins = { key: "coins", namespaced: false, actions: ["getCoinsList"], mutations: ["SET_LIST"] };

test("finds template state, mapActions, dispatch and commit uses of a module", () => {
  const files = {
    "a.vue": `<template><b @click="$store.state.coins.drawer = true"/></template>`,
    "b.vue": `<script>import { mapActions } from "vuex"; export default { methods: { ...mapActions(["getCoinsList"]) } }</script>`,
    "c.js": `store.dispatch("getCoinsList")`,
    "d.js": `context.commit("SET_LIST", [])`,
    "e.js": `rootState.coins.list`,
    "f.vue": `<template>{{ $store.state.sex.list }}</template>`,
  };
  assert.deepEqual(findConsumers(files, coins).map((h) => h.file).sort(), ["a.vue", "b.vue", "c.js", "d.js", "e.js"]);
});

test("finds the namespaced forms", () => {
  const subs = { key: "subscriptions", namespaced: true, actions: ["resetSession"], mutations: [] };
  const files = {
    "a.js": `store.dispatch("subscriptions/resetSession")`,
    "b.vue": `<script>export default { computed: { ...mapState("subscriptions", ["plan"]) } }</script>`,
    "c.js": `store.dispatch("resetSession")`,
  };
  assert.deepEqual(findConsumers(files, subs).map((h) => h.file).sort(), ["a.js", "b.vue"]);
});

test("reports file, line and text of each hit", () => {
  const hits = findConsumers({ "a.js": `x\n  store.dispatch("getCoinsList")` }, coins);
  assert.deepEqual(hits, [{ file: "a.js", line: 2, text: `store.dispatch("getCoinsList")` }]);
});

test("ignores hits inside line comments and HTML comments", () => {
  const files = {
    "a.vue": [
      `<template>`,
      `  <!-- <b @click="$store.state.coins.drawer = true"/> -->`,
      `  <!--`,
      `    {{ $store.state.coins.list }}`,
      `  -->`,
      `  <i>{{ $store.state.coins.record }}</i>`,
      `</template>`,
      `<script>`,
      `// store.dispatch("getCoinsList")`,
      `/* store.dispatch("getCoinsList") */`,
      ` * store.dispatch("getCoinsList")`,
      `store.dispatch("getCoinsList")`,
      `</script>`,
    ].join("\n"),
  };
  assert.deepEqual(findConsumers(files, coins).map((h) => h.line), [6, 12]);
});

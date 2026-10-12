import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRoutes, routeNameForPath } from "./app-routes.mjs";

const ROUTER = `const routes = [
  { path: "/", name: "Login", component: Login },
  {
    path: "/home",
    component: Main,
    meta: { requiresAuth: true },
    children: [
      { path: "", name: "Home", component: Home },
      { path: "folderPricing/verQuote/:id/:step?", name: "verQuote", component: () => import("../views/x.vue") },
      // { path: "old", name: "Old" },
    ],
  },
];
const router = createRouter({ routes });
router.beforeEach(() => ({ name: "Login" }));`;

test("prefixes children with /home and keeps top-level paths", () => {
  assert.deepEqual(parseRoutes(ROUTER), [
    { name: "Login", path: "/" },
    { name: "Home", path: "/home" },
    { name: "verQuote", path: "/home/folderPricing/verQuote/:id/:step?" },
  ]);
});

test("fails when a named route cannot be parsed", () => {
  const source = ROUTER.replace('{ path: "", name: "Home"', '{ name: "Home", path: ""');
  assert.throws(() => parseRoutes(source), /update ROUTE/);
});

const ROUTES = [
  { name: "Login", path: "/" },
  { name: "Home", path: "/home" },
  { name: "verQuote", path: "/home/folderPricing/verQuote/:id/:step?" },
];

test("routeNameForPath matches a static path", () => {
  assert.equal(routeNameForPath(ROUTES, "/home"), "Home");
  assert.equal(routeNameForPath(ROUTES, "/"), "Login");
});

test("routeNameForPath matches a required param", () => {
  assert.equal(routeNameForPath(ROUTES, "/home/folderPricing/verQuote/12/3"), "verQuote");
});

test("routeNameForPath matches an omitted optional param", () => {
  assert.equal(routeNameForPath(ROUTES, "/home/folderPricing/verQuote/12"), "verQuote");
  assert.equal(routeNameForPath(ROUTES, "/home/folderPricing/verQuote/12/"), "verQuote");
});

test("routeNameForPath returns undefined for an unknown path", () => {
  assert.equal(routeNameForPath(ROUTES, "/nowhere"), undefined);
  assert.equal(routeNameForPath(ROUTES, "/home/folderPricing/verQuote"), undefined);
});

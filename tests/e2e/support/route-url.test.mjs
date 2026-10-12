import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRouteUrl } from "./route-url.mjs";

const verQuote = { name: "verQuote", path: "/home/folderPricing/verQuote/:id/:step?" };

test("fills required params and drops missing optional ones", () => {
  assert.equal(buildRouteUrl(verQuote, { verQuote: { id: 7 } }), "/home/folderPricing/verQuote/7");
});

test("keeps optional params that are provided", () => {
  assert.equal(buildRouteUrl(verQuote, { verQuote: { id: 7, step: 2 } }), "/home/folderPricing/verQuote/7/2");
});

test("names the fixture file when a required param is missing", () => {
  assert.throws(() => buildRouteUrl(verQuote, {}), /"id" for route "verQuote".*route-params\.json/);
});

test("leaves param-less paths alone", () => {
  assert.equal(buildRouteUrl({ name: "Login", path: "/" }, {}), "/");
});

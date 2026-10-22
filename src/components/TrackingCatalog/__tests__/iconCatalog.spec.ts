import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { expect, test } from "vitest";
import { filterIcons, parseMdiIconNames, toIconCatalog, toRows } from "@/components/TrackingCatalog/iconCatalog";

const resolve = createRequire(import.meta.url).resolve;
const variables = readFileSync(resolve("@mdi/font/scss/_variables.scss"), "utf8");
const stylesheet = readFileSync(resolve("@mdi/font/css/materialdesignicons.css"), "utf8");
const NOT_SELECTABLE = "mdi-blank";

test("parseMdiIconNames lists every icon the installed font draws", () => {
  const drawn = Array.from(stylesheet.matchAll(/\.(mdi-[a-z0-9-]+)::before/g), ([, name]) => name!);
  expect(parseMdiIconNames(variables).sort()).toEqual(drawn.filter((name) => name !== NOT_SELECTABLE).sort());
});

test("toIconCatalog keeps the Spanish label of suggested icons and spells out the rest", () => {
  expect(toIconCatalog(["mdi-truck", "mdi-truck-delivery-outline"])).toEqual([
    { icon: "mdi-truck", label: "Camión" },
    { icon: "mdi-truck-delivery-outline", label: "truck delivery outline" },
  ]);
});

test("filterIcons finds icons by English name or Spanish label, ignoring case, accents and spaces", () => {
  const catalog = toIconCatalog(["mdi-anchor", "mdi-ferry", "mdi-truck", "mdi-truck-delivery"]);
  const found = (query: string) => filterIcons(catalog, query).map(({ icon }) => icon);
  expect(found("  TRUCK ")).toEqual(["mdi-truck", "mdi-truck-delivery"]);
  expect(found("truck delivery")).toEqual(["mdi-truck-delivery"]);
  expect(found("camion")).toEqual(["mdi-truck"]);
  expect(found("zzz")).toEqual([]);
  expect(filterIcons(catalog, "   ")).toEqual(catalog);
});

test("toRows splits the icons into rows of the given width", () => {
  const catalog = toIconCatalog(["mdi-anchor", "mdi-ferry", "mdi-truck"]);
  expect(toRows(catalog, 2).map((row) => row.map(({ icon }) => icon))).toEqual([
    ["mdi-anchor", "mdi-ferry"],
    ["mdi-truck"],
  ]);
});

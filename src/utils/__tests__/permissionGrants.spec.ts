import { describe, expect, test } from "vitest";
import { grantedCount, grantsFromCatalog, permissionsPayload, setAction, setActions } from "@/utils/permissionGrants";
import type { CatalogScreen } from "@/types/roles";

const action = (name: string, granted = false, grantable = true) => ({ id: 1, code: "0", name, granted, grantable });
const screen = (menu_id: number, actions: ReturnType<typeof action>[]): CatalogScreen => ({
  module_id: 1,
  module: "SEGURIDAD",
  module_order: 1,
  group_id: 12,
  group_name: "EMPRESA Y USUARIO",
  menu_id,
  route: `route${menu_id}`,
  screen: `Pantalla ${menu_id}`,
  actions,
});

describe("permission grants", () => {
  test("the count covers the matrix actions the screens offer and how many of them are granted", () => {
    const screens = [screen(7, [action("VER"), action("NUEVO"), action("FILTRAR")]), screen(8, [action("VER")])];

    expect(grantedCount(screens, { 7: ["VER", "FILTRAR"], 8: [], 9: ["VER"] })).toEqual({ granted: 1, total: 3 });
  });

  test("checking any action also grants VER", () => {
    expect(setAction({}, 7, "NUEVO", true)).toEqual({ 7: ["VER", "NUEVO"] });
  });

  test("checking an action twice keeps it once", () => {
    expect(setAction({ 7: ["VER", "NUEVO"] }, 7, "NUEVO", true)).toEqual({ 7: ["VER", "NUEVO"] });
  });

  test("unchecking an action other than VER keeps the rest of the row", () => {
    expect(setAction({ 7: ["VER", "NUEVO", "EXPORTAR"] }, 7, "NUEVO", false)).toEqual({ 7: ["VER", "EXPORTAR"] });
  });

  test("unchecking VER clears the whole row", () => {
    expect(setAction({ 7: ["VER", "NUEVO", "EXPORTAR"], 8: ["VER"] }, 7, "VER", false)).toEqual({ 7: [], 8: ["VER"] });
  });

  test("selecting several cells grants each one and VER on every row", () => {
    const cells = [
      { menuId: 7, action: "NUEVO" },
      { menuId: 8, action: "NUEVO" },
    ];
    expect(setActions({}, cells, true)).toEqual({ 7: ["VER", "NUEVO"], 8: ["VER", "NUEVO"] });
  });

  test("clearing several cells including VER empties those rows", () => {
    const cells = [
      { menuId: 7, action: "NUEVO" },
      { menuId: 7, action: "VER" },
    ];
    expect(setActions({ 7: ["VER", "NUEVO", "COPIAR"] }, cells, false)).toEqual({ 7: [] });
  });

  test("the catalog's granted actions become the starting grants", () => {
    const catalog = [screen(7, [action("VER", true), action("NUEVO"), action("EXPORTAR", true)]), screen(8, [action("VER")])];
    expect(grantsFromCatalog(catalog)).toEqual({ 7: ["VER", "EXPORTAR"], 8: [] });
  });

  test("the payload lists only screens with at least one action", () => {
    expect(permissionsPayload({ 7: ["VER", "NUEVO"], 8: [] })).toEqual([{ menu_id: 7, actions: ["VER", "NUEVO"] }]);
  });
});

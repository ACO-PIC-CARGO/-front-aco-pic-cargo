import { afterEach, expect, test, vi } from "vitest";
import { entityEditAllowed } from "@/components/folderEntities/entityEditAllowed";

const currentRoute = vi.hoisted(() => ({ value: { meta: {} as Record<string, unknown> } }));
vi.mock("@/router", () => ({ default: { currentRoute } }));

const onScreen = (menuRoute: string, actions: string[] | null) => {
  currentRoute.value = { meta: { menuRoute } };
  if (actions) sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "listClientes", actions }], controlled: ["listClientes"] }));
};

afterEach(() => sessionStorage.removeItem("permissions"));

test("on the client screens a user who may only look at clients cannot unlock the form", () => {
  onScreen("listClientes", ["VER"]);

  expect(entityEditAllowed("listClientes")).toBe(false);
});

test("on the client screens Modificar unlocks the form", () => {
  onScreen("listClientes", ["VER", "MODIFICAR"]);

  expect(entityEditAllowed("listClientes")).toBe(true);
});

test("inside a house dialog the client form keeps the edit the house screen already allowed", () => {
  onScreen("listHouse", ["VER"]);

  expect(entityEditAllowed("listClientes")).toBe(true);
});

test("a session without loaded permissions keeps every edit", () => {
  onScreen("listClientes", null);

  expect(entityEditAllowed("listClientes")).toBe(true);
});

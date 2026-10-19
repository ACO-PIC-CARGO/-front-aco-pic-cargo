import { beforeEach, describe, expect, test, vi } from "vitest";
import type { RouteLocationNormalized } from "vue-router";
import store from "@/store";
import planAccessGuard from "@/router/planAccessGuard";

const modulesForRoute = vi.fn();
const lockedModuleForRoute = vi.fn();
const lockedModuleNotice = vi.fn();

vi.mock("@/store", () => ({
  default: {
    getters: {
      get "subscriptions/modulesForRoute"() {
        return modulesForRoute;
      },
      get "subscriptions/lockedModuleForRoute"() {
        return lockedModuleForRoute;
      },
      get "subscriptions/lockedModuleNotice"() {
        return lockedModuleNotice;
      },
    },
    dispatch: vi.fn(),
  },
}));

const route = (name?: string) => ({ name }) as RouteLocationNormalized;

describe("planAccessGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    modulesForRoute.mockReturnValue([{ name: "Cotizaciones" }]);
    lockedModuleForRoute.mockReturnValue(undefined);
    lockedModuleNotice.mockReturnValue({ text: "locked" });
  });

  test("lets a route without plan modules through without loading plan access", async () => {
    modulesForRoute.mockReturnValue([]);
    expect(await planAccessGuard(route("Home"), route("Login"))).toBeUndefined();
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  test("lets the miPlan route through without loading plan access", async () => {
    expect(await planAccessGuard(route("miPlan"), route("Home"))).toBeUndefined();
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  test("blocks a locked module and prompts the upgrade when navigating from another route", async () => {
    lockedModuleForRoute.mockReturnValue({ name: "Cotizaciones" });
    expect(await planAccessGuard(route("pricing"), route("Home"))).toBe(false);
    expect(lockedModuleNotice).toHaveBeenCalledWith("Cotizaciones");
    expect(store.dispatch).toHaveBeenCalledWith("subscriptions/loadPlanAccess");
    expect(store.dispatch).toHaveBeenCalledWith("subscriptions/promptPlanUpgrade", { text: "locked" });
  });

  test("redirects a locked module to miPlan on a first navigation", async () => {
    lockedModuleForRoute.mockReturnValue({ name: "Cotizaciones" });
    expect(await planAccessGuard(route("pricing"), route())).toEqual({ name: "miPlan" });
    expect(store.dispatch).toHaveBeenCalledWith("subscriptions/promptPlanUpgrade", { text: "locked" });
  });

  test("lets the route through once plan access shows the module unlocked", async () => {
    expect(await planAccessGuard(route("pricing"), route("Home"))).toBeUndefined();
    expect(store.dispatch).toHaveBeenCalledTimes(1);
    expect(store.dispatch).toHaveBeenCalledWith("subscriptions/loadPlanAccess");
  });

  test("reads the stored menu and treats corrupt JSON as an empty menu", async () => {
    sessionStorage.setItem("menu", JSON.stringify([{ id: 1 }]));
    await planAccessGuard(route("pricing"), route("Home"));
    expect(modulesForRoute).toHaveBeenLastCalledWith([{ id: 1 }], "pricing");

    sessionStorage.setItem("menu", "{not json");
    await planAccessGuard(route("pricing"), route("Home"));
    expect(modulesForRoute).toHaveBeenLastCalledWith([], "pricing");
  });
});

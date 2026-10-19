import { beforeEach, describe, expect, test, vi } from "vitest";
import type { RouteLocationNormalized } from "vue-router";
import planAccessGuard from "@/router/planAccessGuard";

const subscriptionsStore = {
  modulesForRoute: vi.fn(),
  lockedModuleForRoute: vi.fn(),
  lockedModuleNotice: vi.fn(),
  loadPlanAccess: vi.fn(),
  promptPlanUpgrade: vi.fn(),
};

vi.mock("@/stores/subscriptions", () => ({ useSubscriptionsStore: () => subscriptionsStore }));

const route = (name?: string) => ({ name }) as RouteLocationNormalized;

describe("planAccessGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    subscriptionsStore.modulesForRoute.mockReturnValue([{ name: "Cotizaciones" }]);
    subscriptionsStore.lockedModuleForRoute.mockReturnValue(undefined);
    subscriptionsStore.lockedModuleNotice.mockReturnValue({ text: "locked" });
    subscriptionsStore.loadPlanAccess.mockResolvedValue(null);
  });

  test("lets a route without plan modules through without loading plan access", async () => {
    subscriptionsStore.modulesForRoute.mockReturnValue([]);
    expect(await planAccessGuard(route("Home"), route("Login"))).toBeUndefined();
    expect(subscriptionsStore.loadPlanAccess).not.toHaveBeenCalled();
    expect(subscriptionsStore.promptPlanUpgrade).not.toHaveBeenCalled();
  });

  test("lets the miPlan route through without loading plan access", async () => {
    expect(await planAccessGuard(route("miPlan"), route("Home"))).toBeUndefined();
    expect(subscriptionsStore.loadPlanAccess).not.toHaveBeenCalled();
    expect(subscriptionsStore.promptPlanUpgrade).not.toHaveBeenCalled();
  });

  test("blocks a locked module and prompts the upgrade when navigating from another route", async () => {
    subscriptionsStore.lockedModuleForRoute.mockReturnValue({ name: "Cotizaciones" });
    expect(await planAccessGuard(route("pricing"), route("Home"))).toBe(false);
    expect(subscriptionsStore.lockedModuleNotice).toHaveBeenCalledWith("Cotizaciones");
    expect(subscriptionsStore.loadPlanAccess).toHaveBeenCalledTimes(1);
    expect(subscriptionsStore.promptPlanUpgrade).toHaveBeenCalledWith({ text: "locked" });
  });

  test("redirects a locked module to miPlan on a first navigation", async () => {
    subscriptionsStore.lockedModuleForRoute.mockReturnValue({ name: "Cotizaciones" });
    expect(await planAccessGuard(route("pricing"), route())).toEqual({ name: "miPlan" });
    expect(subscriptionsStore.promptPlanUpgrade).toHaveBeenCalledWith({ text: "locked" });
  });

  test("lets the route through once plan access shows the module unlocked", async () => {
    expect(await planAccessGuard(route("pricing"), route("Home"))).toBeUndefined();
    expect(subscriptionsStore.loadPlanAccess).toHaveBeenCalledTimes(1);
    expect(subscriptionsStore.promptPlanUpgrade).not.toHaveBeenCalled();
  });

  test("reads the locked module only after plan access has loaded", async () => {
    let finishLoading!: () => void;
    subscriptionsStore.loadPlanAccess.mockReturnValue(new Promise<void>((resolve) => (finishLoading = resolve)));
    const result = planAccessGuard(route("pricing"), route("Home"));
    await Promise.resolve();
    expect(subscriptionsStore.lockedModuleForRoute).not.toHaveBeenCalled();
    finishLoading();
    await result;
    expect(subscriptionsStore.lockedModuleForRoute).toHaveBeenCalledWith([], "pricing");
  });

  test("reads the stored menu and treats corrupt JSON as an empty menu", async () => {
    sessionStorage.setItem("menu", JSON.stringify([{ id: 1 }]));
    await planAccessGuard(route("pricing"), route("Home"));
    expect(subscriptionsStore.modulesForRoute).toHaveBeenLastCalledWith([{ id: 1 }], "pricing");

    sessionStorage.setItem("menu", "{not json");
    await planAccessGuard(route("pricing"), route("Home"));
    expect(subscriptionsStore.modulesForRoute).toHaveBeenLastCalledWith([], "pricing");
  });
});

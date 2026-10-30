import { describe, expect, test } from "vitest";
import router from "@/router";

describe("route owners", () => {
  test("every detail route names an existing route as the menu route that owns it", () => {
    const routes = router.getRoutes();
    const names = new Set(routes.map((route) => route.name));
    const owners = routes.map((route) => route.meta.menuRoute).filter(Boolean);

    expect(owners.length).toBeGreaterThan(0);
    expect(owners.filter((owner) => !names.has(owner))).toEqual([]);
  });
});

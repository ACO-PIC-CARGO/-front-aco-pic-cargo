import { beforeEach, describe, expect, test, vi } from "vitest";
import type { RouteLocationNormalized } from "vue-router";
import Swal from "sweetalert2";
import permissionGuard, { NO_SCREEN_ACCESS } from "@/router/permissionGuard";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const route = (name?: string, meta = {}) => ({ name, meta }) as RouteLocationNormalized;

describe("permissionGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.setItem(
      "permissions",
      JSON.stringify({
        screens: [{ route: "listUser", actions: ["VER"] }, { route: "lstPosition", actions: [] }],
        controlled: ["listUser", "lstPosition", "Main"],
      }),
    );
  });

  test("lets a screen the user may see through", () => {
    expect(permissionGuard(route("listUser"), route("Main"))).toBeUndefined();
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("lets a route outside the permission catalog through", () => {
    expect(permissionGuard(route("miPlan"), route("Main"))).toBeUndefined();
  });

  test("keeps the user where they were and explains why when the screen is not theirs", () => {
    expect(permissionGuard(route("lstPosition"), route("listUser"))).toBe(false);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "warning", text: NO_SCREEN_ACCESS });
  });

  test("names the missing permission when the session knows the screen's name", () => {
    const permissions = JSON.parse(sessionStorage.getItem("permissions")!);
    sessionStorage.setItem(
      "permissions",
      JSON.stringify({ ...permissions, screenNames: { lstPosition: "CONFIGURACIÓN › EMPRESA Y USUARIO › ROLES" } }),
    );

    permissionGuard(route("lstPosition"), route("listUser"));

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({
      text: "No tienes el permiso CONFIGURACIÓN › EMPRESA Y USUARIO › ROLES › VER para abrir esta pantalla. Pide a un administrador de tu empresa que te lo asigne.",
    });
  });

  test("sends a first navigation to a refused screen to Main", () => {
    expect(permissionGuard(route("lstPosition"), route())).toEqual({ name: "Main" });
    expect(Swal.fire).toHaveBeenCalledTimes(1);
  });

  test("checks a detail route against the menu screen that owns it", () => {
    expect(permissionGuard(route("editarPosicion", { menuRoute: "lstPosition" }), route())).toEqual({ name: "Main" });
    expect(permissionGuard(route("editarUser", { menuRoute: "listUser" }), route())).toBeUndefined();
  });

  test("never refuses Main, so a refused first navigation cannot loop", () => {
    expect(permissionGuard(route("Main"), route())).toBeUndefined();
  });
});

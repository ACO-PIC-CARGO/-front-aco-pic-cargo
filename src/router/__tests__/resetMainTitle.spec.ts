import { beforeEach, describe, expect, test, vi } from "vitest";
import type { RouteLocationNormalized } from "vue-router";
import resetMainTitle from "@/router/resetMainTitle";

const appStore = { mainTitle: "BANCOS - SOLICITUDES DE PAGO" };
vi.mock("@/stores/app", () => ({ useAppStore: () => appStore }));

const vistaA = {};
const vistaB = {};
const route = (component: object) =>
  ({ matched: [{ components: { default: {} } }, { components: { default: component } }] }) as unknown as RouteLocationNormalized;

describe("resetMainTitle", () => {
  beforeEach(() => {
    appStore.mainTitle = "BANCOS - SOLICITUDES DE PAGO";
  });

  test("vacía el título al entrar a otra vista", () => {
    resetMainTitle(route(vistaB), route(vistaA));
    expect(appStore.mainTitle).toBe("");
  });

  test("mantiene el título si la vista se reutiliza", () => {
    resetMainTitle(route(vistaA), route(vistaA));
    expect(appStore.mainTitle).toBe("BANCOS - SOLICITUDES DE PAGO");
  });
});

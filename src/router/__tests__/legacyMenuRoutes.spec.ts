import { expect, test } from "vitest";
import router from "@/router";

const screenOf = (name: string) => router.getRoutes().find((route) => route.name === name)?.components?.default;

test("the HISTORIAL DE FACTURACIÓN menu item opens the billing history", () => {
  expect(screenOf("lstFacturacionMembresia")).toBeDefined();
  expect(screenOf("lstFacturacionMembresia")).toBe(screenOf("billingHistory"));
});

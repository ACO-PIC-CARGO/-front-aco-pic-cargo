import { expect, test } from "vitest";
import { messageLabel } from "../messageLabel";

test("sales to pricing reads from Ventas for Pricing", () => {
  expect(messageLabel("sales_to_pricing")).toBe("De Ventas para Pricing");
});

test("pricing to sales reads from Pricing for Ventas", () => {
  expect(messageLabel("pricing_to_sales")).toBe("De Pricing para Ventas");
});

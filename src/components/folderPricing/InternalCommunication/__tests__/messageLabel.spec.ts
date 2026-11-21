import { expect, test } from "vitest";
import { messageAuthor, messageLabel, messageRecipient, messageRoute } from "../messageLabel";

test("sales to pricing reads from Ventas for Pricing", () => {
  expect(messageLabel("sales_to_pricing")).toBe("De Ventas para Pricing");
});

test("pricing to sales reads from Pricing for Ventas", () => {
  expect(messageLabel("pricing_to_sales")).toBe("De Pricing para Ventas");
});

test("the route names who writes to whom", () => {
  expect(messageRoute("sales_to_pricing")).toBe("Ventas → Pricing");
  expect(messageRoute("pricing_to_sales")).toBe("Pricing → Ventas");
});

test("author and recipient carry their role", () => {
  const message = { direction: "pricing_to_sales", author_name: "KIARA", recipient_name: "CARLOS RAMIREZ" } as const;

  expect(messageAuthor(message)).toBe("KIARA (Pricing)");
  expect(messageRecipient(message)).toBe("CARLOS RAMIREZ (Ventas)");
});

test("a party known only by its role is not named twice", () => {
  const message = { direction: "sales_to_pricing", author_name: "Ventas", recipient_name: null } as const;

  expect(messageAuthor(message)).toBe("Ventas");
  expect(messageRecipient(message)).toBe("Pricing");
});

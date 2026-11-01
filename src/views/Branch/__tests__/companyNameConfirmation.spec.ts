import { describe, expect, test } from "vitest";
import { confirmsCompanyName } from "../companyNameConfirmation";

describe("confirmsCompanyName", () => {
  test("accepts the company name typed without its extra spaces or capitals", () => {
    expect(confirmsCompanyName("carlos prueba eliminar", " CARLOS  PRUEBA ELIMINAR ")).toBe(true);
  });

  test("refuses another name", () => {
    expect(confirmsCompanyName("CARLOS PRUEBA", "CARLOS PRUEBA ELIMINAR")).toBe(false);
  });

  test("refuses an empty answer", () => {
    expect(confirmsCompanyName("   ", "CARLOS PRUEBA ELIMINAR")).toBe(false);
  });
});

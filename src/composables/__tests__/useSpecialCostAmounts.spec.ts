import { beforeEach, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useSpecialCostAmounts } from "@/composables/useSpecialCostAmounts";
import { usePricingStore } from "@/stores/pricing";
import type { Costo } from "@/types/cotizacion";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

beforeEach(() => {
  setActivePinia(createPinia());
  const pricing = usePricingStore();
  pricing.listMultiplicador = [{ id: 1, code: 1, valor: 1 }];
  pricing.totalFlete = 500;
});

test.each([
  [4000, 50],
  [9000, 80],
  [20000, 80 + (20000 + 500) * 1.01 * 0.0025],
])("the confección charge for goods worth %d is %d", (amount, expected) => {
  usePricingStore().datosPrincipales = { amount };
  const line: Costo = { code_cost: 33, costounitario: 0 };

  useSpecialCostAmounts().confeccionAmount(line);

  expect(Number(line.costounitario)).toBeCloseTo(expected, 2);
});

test("the ITBM is 7% of the local charges it applies to", () => {
  const line: Costo = { code_cost: 38, costounitario: 0 };
  const costs: Costo[] = [
    { code_cost: 29, id_multiplicador: 1, costounitario: 100 },
    { code_cost: 36, id_multiplicador: 1, costounitario: 50 },
    { code_cost: 10, id_multiplicador: 1, costounitario: 999 },
    line,
  ];

  useSpecialCostAmounts().itbmAmount(line, costs);

  expect(line.costounitario).toBe(10.5);
});

test("the credit note gives back half of the confección charge", () => {
  const line: Costo = { code_cost: 69, costounitario: 0 };

  useSpecialCostAmounts().creditNoteAmount(line, [{ code_cost: 33, costounitario: 80 }, line]);

  expect(line.costounitario).toBe(-40);
});

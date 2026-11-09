import { describe, expect, test } from "vitest";
import { quoteOptionTotals } from "../quoteOptionTotals";
import type { QuoteCargo } from "../quoteOptionTotals";
import type { Costo, Multiplicador } from "@/types/cotizacion";

const ISO_PERU = 9589;
const multipliers: Multiplicador[] = [
  { id: 1, code: 1, valor: 1 },
  { id: 2, code: 2, valor: 1 },
  { id: 13, code: 13, valor: 1 },
  { id: 24, code: 24, valor: 1 },
  { id: 80, code: 8, valor: 1, id_container: 20 },
];
const cargo = (fields: Partial<QuoteCargo> = {}): QuoteCargo => ({ weight: 1000, volume: 3, amount: 1000, containers: [], ...fields });
const cost = (fields: Partial<Costo>): Costo => ({ status: 1, esopcionflag: 1, esventaflag: 0, esorigenflag: 1, minimo: 0, ...fields });
const sale = (fields: Partial<Costo>): Costo => cost({ esopcionflag: 0, esventaflag: 1, ...fields });
const totals = (costs: Costo[], cargoFields: Partial<QuoteCargo> = {}) =>
  quoteOptionTotals({ costs, multipliers, cargo: cargo(cargoFields), isoCountry: ISO_PERU });

describe("quoteOptionTotals", () => {
  test("cost and sale multiply the unit price by the cargo factor and profit is their difference", () => {
    expect(totals([cost({ id_multiplicador: 2, costounitario: 50 }), sale({ id_multiplicador: 2, costounitario: 80 })])).toEqual({
      cost: 150,
      sale: 240,
      profit: 90,
    });
  });

  test("the minimum replaces a smaller amount when the row asks for it", () => {
    expect(totals([cost({ id_multiplicador: 2, costounitario: 10, minimo: 25, considerarvalorminimoflag: true })], { volume: 1 }).cost).toBe(25);
  });

  test("a per-container multiplier uses the quantity of its container", () => {
    const costs = [cost({ id_multiplicador: 80, costounitario: 1000 })];
    expect(totals(costs, { containers: [{ id_containers: 20, cantidad: 2 }] }).cost).toBe(2000);
  });

  test("a percentage row is computed on the CIF built with the sale freight", () => {
    const costs = [
      sale({ id_multiplicador: 2, costounitario: 100, esfleteflag: 1, esorigenflag: 0 }),
      sale({ id_multiplicador: 13, cif: 2, esorigenflag: 0, esaduanaflag: 1 }),
    ];
    // freight 100 x 2 m3 = 200; customs 2% of (1000 + 200) = 24
    expect(totals(costs, { volume: 2 }).sale).toBe(224);
  });

  test("a row whose multiplier is not in the catalog counts 0", () => {
    expect(totals([cost({ id_multiplicador: 999, costounitario: 70 })])).toEqual({ cost: 0, sale: 0, profit: 0 });
  });

  test("the freight of a cargo under 1 m3 is charged for at least 1 m3", () => {
    expect(totals([cost({ id_multiplicador: 2, costounitario: 40, code_cost: 4 })], { volume: 0.5 }).cost).toBe(40);
  });

  test("Peru's discharge minimum lifts a small W/M charge to 30", () => {
    expect(totals([cost({ id_multiplicador: 24, costounitario: 10 })], { weight: 500, volume: 1 }).cost).toBe(30);
  });

  test("inactive rows do not count", () => {
    expect(totals([cost({ id_multiplicador: 2, costounitario: 50, status: 0 })]).cost).toBe(0);
  });
});

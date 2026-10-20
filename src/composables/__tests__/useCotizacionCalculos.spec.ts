import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useCotizacionCalculos } from "@/composables/useCotizacionCalculos";
import { usePricingStore } from "@/stores/pricing";
import type { DatosPrincipales, Multiplicador } from "@/types/cotizacion";

vi.mock("@/router", () => ({ default: {} }));
vi.mock("@/api/http", () => ({ default: {} }));

const setPricing = (
  listMultiplicador: Multiplicador[],
  datosPrincipales: DatosPrincipales = {},
) => {
  const pricing = usePricingStore();
  pricing.listMultiplicador = listMultiplicador;
  pricing.datosPrincipales = datosPrincipales;
};

const { calcularFac, calcularTotalFleteVentaPorOpcion } =
  useCotizacionCalculos();

beforeEach(() => setActivePinia(createPinia()));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("calcularFac", () => {
  beforeEach(() => setPricing([]));

  test("returns the container count when the multiplier is tied to a container", () => {
    setPricing([{ code: 30, id_container: 5 }]);
    const containers = [
      { id_containers: 4, cantidad: 9 },
      { id_containers: 5, cantidad: 3 },
    ];
    expect(calcularFac(30, 10, 10, containers)).toBe(3);
    expect(calcularFac(30, 10, 10, [{ id_containers: 8, cantidad: 2 }])).toBe(0);
    expect(calcularFac(30, 10, 10, [])).toBe(0);
    expect(calcularFac(30, 10, 10, null)).toBe(0);
  });

  test("matches the multiplier code loosely before the container lookup", () => {
    setPricing([{ code: "7", id_container: 5 }]);
    expect(calcularFac(7, 0, 0, [{ id_containers: 5, cantidad: 4 }])).toBe(4);
  });

  test("codes 1 and 14 use the configured value, defaulting to 1", () => {
    setPricing([
      { code: 1, valor: "2.5" },
      { code: 14, valor: 0 },
    ]);
    expect(calcularFac(1)).toBe(2.5);
    expect(calcularFac(14)).toBe(1);
    setPricing([]);
    expect(calcularFac(1)).toBe(1);
  });

  test("code 2 uses the volume", () => {
    expect(calcularFac(2, 4.5, 100)).toBe(4.5);
    expect(calcularFac(2)).toBe(0);
  });

  test("code 3 takes the larger of tons and volume", () => {
    expect(calcularFac(3, 1, 2000)).toBe(2);
    expect(calcularFac(3, 5, 2000)).toBe(5);
    expect(calcularFac(3, 2, 2000)).toBe(2);
    expect(calcularFac(3)).toBe(0);
  });

  test("code 4 converts kilograms to tons", () => {
    expect(calcularFac(4, 0, 2500)).toBe(2.5);
    expect(calcularFac(4, 0, 0)).toBe(0);
    expect(calcularFac(4, 0, -1000)).toBe(-1);
  });

  test("code 6 takes the larger of volumetric weight and kilograms", () => {
    expect(calcularFac(6, 2, 100)).toBeCloseTo(333.32, 10);
    expect(calcularFac(6, 2, 1000)).toBe(1000);
    expect(calcularFac(6, 6, 1000)).toBe(1000);
  });

  test("code 15 takes a percent of the amount", () => {
    expect(calcularFac(15, 0, 0, [], 250)).toBe(2.5);
    expect(calcularFac(15)).toBe(0);
  });

  test("code 18 uses the kilograms", () => {
    expect(calcularFac(18, 3, 77)).toBe(77);
  });

  test("code 24 uses tons below 15 m3 and the largest of tons, a third of the volume and 1 otherwise", () => {
    expect(calcularFac(24, 14.9, 3000)).toBe(3);
    expect(calcularFac(24, 15, 3000)).toBe(5);
    expect(calcularFac(24, 30, 20000)).toBe(20);
    expect(calcularFac(24, 15, 0)).toBe(5);
  });

  test("string inputs are coerced for arithmetic and returned raw where the formula picks them", () => {
    expect(calcularFac(2, "4,5")).toBe("4,5");
    expect(calcularFac(2, null)).toBe(null);
    expect(calcularFac(3, "5", "2000")).toBe("5");
    expect(calcularFac(3, "1", "2000")).toBe(2);
    expect(calcularFac(6, "2", "100")).toBeCloseTo(333.32, 10);
    expect(calcularFac(6, "1", "1000")).toBe("1000");
    expect(calcularFac(18, 0, "77")).toBe("77");
    expect(calcularFac(4, 0, null)).toBe(0);
    expect(calcularFac(15, 0, 0, [], "1,000")).toBeNaN();
    expect(calcularFac(24, "30", "20000")).toBe(20);
    expect(calcularFac(24, "10", "3000")).toBe(3);
  });

  test("unknown, string or missing codes give 1", () => {
    expect(calcularFac(99, 5, 5)).toBe(1);
    expect(calcularFac("2", 5, 5)).toBe(1);
    expect(calcularFac()).toBe(1);
    expect(calcularFac(null, 5, 5)).toBe(1);
  });
});

describe("calcularTotalFleteVentaPorOpcion", () => {
  const freightCost = {
    esfleteflag: 1,
    status: 1,
    esventaflag: 1,
    id_multiplicador: 1,
    costounitario: "10",
  };

  beforeEach(() =>
    setPricing(
      [
        { id: 1, code: 2, valor: "2" },
        { id: 2, code: 1, valor: "3" },
        { id: 3, code: 13, valor: 5 },
      ],
      { volumen: 4, peso: 1000, containers: [], amount: 0 },
    ),
  );

  test("sums value times unit cost times factor of sale freight costs", () => {
    expect(
      calcularTotalFleteVentaPorOpcion({
        listCostos: [
          freightCost,
          { ...freightCost, id_multiplicador: 2, costounitario: 5 },
        ],
      }),
    ).toBe(125);
  });

  test("ignores costs that are not active sale freight", () => {
    expect(
      calcularTotalFleteVentaPorOpcion({
        listCostos: [
          { ...freightCost, esfleteflag: 0 },
          { ...freightCost, status: 0 },
          { ...freightCost, esventaflag: 0 },
          null,
          freightCost,
        ],
      }),
    ).toBe(80);
  });

  test("skips percentage multipliers 5, 13 and 14", () => {
    expect(
      calcularTotalFleteVentaPorOpcion({
        listCostos: [{ ...freightCost, id_multiplicador: 3 }],
      }),
    ).toBe(0);
  });

  test("counts a cost with an unknown multiplier as zero", () => {
    expect(
      calcularTotalFleteVentaPorOpcion({
        listCostos: [{ ...freightCost, id_multiplicador: 99 }],
      }),
    ).toBe(0);
  });

  test("cost code 4 uses a factor of at least 1 when the volume is under 1", () => {
    setPricing([{ id: 1, code: 2, valor: "2" }], { volumen: 0.5 });
    expect(
      calcularTotalFleteVentaPorOpcion({
        listCostos: [{ ...freightCost, code_cost: 4 }],
      }),
    ).toBe(20);
    expect(
      calcularTotalFleteVentaPorOpcion({
        listCostos: [{ ...freightCost, code_cost: 5 }],
      }),
    ).toBe(10);
    setPricing([{ id: 1, code: 2, valor: "2" }], { volumen: 2 });
    expect(
      calcularTotalFleteVentaPorOpcion({
        listCostos: [{ ...freightCost, code_cost: 4 }],
      }),
    ).toBe(40);
  });

  test("treats missing or non-numeric values as zero", () => {
    setPricing([{ id: 1, code: 2, valor: "abc" }], { volumen: "1,5" });
    expect(
      calcularTotalFleteVentaPorOpcion({ listCostos: [freightCost] }),
    ).toBe(0);
    setPricing([{ id: 1, code: 2, valor: 2 }], {});
    expect(
      calcularTotalFleteVentaPorOpcion({ listCostos: [freightCost] }),
    ).toBe(0);
  });

  test("returns 0 for no costs or invalid input", () => {
    expect(calcularTotalFleteVentaPorOpcion()).toBe(0);
    expect(calcularTotalFleteVentaPorOpcion({})).toBe(0);
    expect(calcularTotalFleteVentaPorOpcion({ listCostos: [] })).toBe(0);
    expect(
      calcularTotalFleteVentaPorOpcion({
        listCostos: "x" as never,
      }),
    ).toBe(0);
  });
});

describe("formatearCostos", () => {
  const { formatearCostos } = useCotizacionCalculos();
  const multiplicadores = [{ id: 1, code: 2, valor: 3 }];
  const baseCost = {
    nameservice: "Flete",
    esfleteflag: 1,
    status: 1,
    id_multiplicador: 1,
    costounitario: 10,
  };

  beforeEach(() => {
    setPricing([]);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  test("returns an empty list without costs", () => {
    expect(formatearCostos({})).toEqual([]);
  });

  test("adds defaults and a zero subtotal to each kept cost", () => {
    expect(
      formatearCostos({ costos: [baseCost], multiplicadores }),
    ).toEqual([
      {
        ...baseCost,
        code_service: "",
        code_cost: "",
        id: "",
        concepto: "Flete",
        minimo: 0,
        subtotal: 0,
      },
    ]);
  });

  test("keeps provided identifiers and minimum", () => {
    const [cost] = formatearCostos({
      costos: [
        {
          ...baseCost,
          code_service: "FL",
          code_cost: 4,
          id: 12,
          minimo: 50,
        },
      ],
      multiplicadores,
    });
    expect(cost).toMatchObject({
      code_service: "FL",
      code_cost: 4,
      id: 12,
      minimo: 50,
    });
  });

  test("keeps a cost without a multiplier id", () => {
    const costs = formatearCostos({
      costos: [{ ...baseCost, id_multiplicador: undefined }],
      multiplicadores,
    });
    expect(costs).toHaveLength(1);
    expect(costs[0]!.subtotal).toBe(0);
  });

  test("drops costs whose multiplier is not found", () => {
    expect(
      formatearCostos({
        costos: [{ ...baseCost, id_multiplicador: 99 }],
        multiplicadores,
      }),
    ).toEqual([]);
  });

  test("keeps only costs that have a flag and status 1", () => {
    const costs = formatearCostos({
      costos: [
        { ...baseCost, nameservice: "ok" },
        { ...baseCost, nameservice: "inactive", status: 0 },
        { ...baseCost, nameservice: "noflag", esfleteflag: 0 },
        { ...baseCost, nameservice: "stringstatus", status: "1" },
        { ...baseCost, nameservice: "stringflag", esfleteflag: "0" },
        {
          nameservice: "origin",
          esorigenflag: 1,
          status: 1,
          id_multiplicador: 1,
        },
      ],
      multiplicadores,
    });
    expect(costs.map((cost) => cost.concepto)).toEqual([
      "ok",
      "stringstatus",
      "stringflag",
      "origin",
    ]);
  });

  test("logs the discarded records", () => {
    formatearCostos({
      costos: [{ ...baseCost, nameservice: "inactive", status: 0 }],
      multiplicadores,
    });
    expect(console.log).toHaveBeenCalledWith("Registro descartado:", "inactive", {
      flags: [undefined, 1, undefined, undefined, undefined, undefined],
      status: 0,
    });
  });
});

describe("formatearCostosEditar", () => {
  const { formatearCostosEditar } = useCotizacionCalculos();
  const multiplicadores = [{ id: 1, code: 2, valor: 3 }];
  const baseCost = {
    nameservice: "Local",
    eslocalflag: 1,
    status: 1,
    id_multiplicador: 1,
    costounitario: 10,
  };

  beforeEach(() => setPricing([]));

  test("returns an empty list without costs", () => {
    expect(formatearCostosEditar({})).toEqual([]);
  });

  test("adds null defaults and a zero subtotal to each kept cost", () => {
    expect(
      formatearCostosEditar({ costos: [baseCost], multiplicadores }),
    ).toEqual([
      {
        ...baseCost,
        code_cost: null,
        id: null,
        concepto: "Local",
        minimo: 0,
        subtotal: 0,
      },
    ]);
  });

  test("keeps provided identifiers and minimum", () => {
    const [cost] = formatearCostosEditar({
      costos: [{ ...baseCost, code_cost: 7, id: 3, minimo: 20 }],
      multiplicadores,
    });
    expect(cost).toMatchObject({ code_cost: 7, id: 3, minimo: 20 });
  });

  test("keeps a cost without a multiplier id and drops an unknown one", () => {
    expect(
      formatearCostosEditar({
        costos: [{ ...baseCost, id_multiplicador: undefined }],
        multiplicadores,
      }),
    ).toHaveLength(1);
    expect(
      formatearCostosEditar({
        costos: [{ ...baseCost, id_multiplicador: 99 }],
        multiplicadores,
      }),
    ).toEqual([]);
  });

  test("keeps only costs whose flag equals true and whose status is 1", () => {
    const costs = formatearCostosEditar({
      costos: [
        { ...baseCost, nameservice: "one" },
        { ...baseCost, nameservice: "true", eslocalflag: true },
        { ...baseCost, nameservice: "stringone", eslocalflag: "1" },
        { ...baseCost, nameservice: "stringzero", eslocalflag: "0" },
        { ...baseCost, nameservice: "two", eslocalflag: 2 },
        { ...baseCost, nameservice: "inactive", status: 0 },
        { ...baseCost, nameservice: "origin", eslocalflag: 0, esorigenflag: 1 },
      ],
      multiplicadores,
    });
    expect(costs.map((cost) => cost.concepto)).toEqual([
      "one",
      "true",
      "stringone",
      "origin",
    ]);
  });
});

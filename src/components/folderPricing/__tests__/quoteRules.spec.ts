import { describe, expect, test, vi } from "vitest";
import Swal from "sweetalert2";
import {
  blockedQuoteSave,
  defaultQuoteStatus,
  hasInvalidMultiplier,
  positiveInteger,
  quoteSaveProblem,
  servicesStepErrors,
} from "@/components/folderPricing/quoteRules";
import type { OpcionCosto } from "@/types/cotizacion";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

describe("positiveInteger", () => {
  test.each([1, "1", 35, "35", " 7 "])("accepts %p", (value) => {
    expect(positiveInteger(value)).toBe(true);
  });

  test.each([2.5, "2.5", 1.5, -2, "-2", 0, "0", "", null, undefined, "abc", "1e3"])(
    "rejects %p with a message",
    (value) => {
      expect(positiveInteger(value)).toEqual(expect.any(String));
    },
  );
});

describe("hasInvalidMultiplier", () => {
  const multiplicadores = [{ id: 1 }, { id: "2" }];

  test("a cost whose multiplier is in the active list is valid", () => {
    expect(hasInvalidMultiplier({ id_multiplicador: 1 }, multiplicadores)).toBe(false);
    expect(hasInvalidMultiplier({ id_multiplicador: 2 }, multiplicadores)).toBe(false);
  });

  test("a cost without a multiplier is not flagged", () => {
    expect(hasInvalidMultiplier({ id_multiplicador: "" }, multiplicadores)).toBe(false);
    expect(hasInvalidMultiplier({}, multiplicadores)).toBe(false);
  });

  test("a cost whose multiplier is missing from the active list is flagged", () => {
    expect(hasInvalidMultiplier({ id_multiplicador: 37 }, multiplicadores)).toBe(true);
  });
});

describe("quoteSaveProblem", () => {
  const multiplicadores = [{ id: 1 }];
  const opcion = (patch: Partial<OpcionCosto> = {}): OpcionCosto => ({
    nro_propuesta: 1,
    tiempo_transito: 35,
    listCostos: [{ nameservice: "FLETE", status: 1, id_multiplicador: 1 }],
    listImpuestos: [],
    listNotasQuote: [],
    ...patch,
  });

  test("a complete quote has no problem", () => {
    expect(quoteSaveProblem({ opcionCostos: [opcion()], containers: [], multiplicadores })).toBeNull();
  });

  test("names the option whose transit time is not a positive whole number", () => {
    const problem = quoteSaveProblem({
      opcionCostos: [opcion(), opcion({ nro_propuesta: 2, tiempo_transito: 2.5 })],
      containers: [],
      multiplicadores,
    });
    expect(problem).toContain("opción 2");
    expect(problem).not.toContain("opción 1");
  });

  test("names the container whose quantity is not a positive whole number", () => {
    const problem = quoteSaveProblem({
      opcionCostos: [opcion()],
      containers: [
        { description: "20 ST", cantidad: 2 },
        { description: "40 HC", cantidad: 1.5 as never },
      ],
      multiplicadores,
    });
    expect(problem).toContain("40 HC");
    expect(problem).not.toContain("20 ST");
  });

  test("lists each active line whose multiplier is not valid once, across options", () => {
    const invalid = { nameservice: "HANDLING", status: 1, id_multiplicador: 37 };
    const problem = quoteSaveProblem({
      opcionCostos: [
        opcion({ listCostos: [invalid, { ...invalid, esventaflag: 1 }] }),
        opcion({ nro_propuesta: 2, listCostos: [invalid, { nameservice: "REMOVED", status: 0, id_multiplicador: 37 }] }),
      ],
      containers: [],
      multiplicadores,
    });
    expect(problem).toContain("HANDLING");
    expect(problem!.match(/HANDLING/g)).toHaveLength(1);
    expect(problem).not.toContain("REMOVED");
  });
});

describe("defaultQuoteStatus", () => {
  const preliminar = { id: 10, name: "PRELIMINAR", status: 1 };
  const configured = { id: 20, name: "EN PROCESO", status: 1, defaultstatus: true };

  test("prefers the status the company configured as default", () => {
    expect(defaultQuoteStatus([preliminar, configured])).toBe(configured);
    expect(defaultQuoteStatus([preliminar, { ...configured, defaultstatus: "1" }])!.id).toBe(20);
    expect(defaultQuoteStatus([preliminar, { ...configured, defaultstatus: 1 }])!.id).toBe(20);
  });

  test("falls back to the first active PRELIMINAR status", () => {
    expect(
      defaultQuoteStatus([
        { id: 1, name: "COTIZADO", status: 1, defaultstatus: false },
        { id: 2, name: "Preliminar", status: 0 },
        { id: 3, name: "PRELIMINAR CLIENTE", status: 1 },
      ])!.id,
    ).toBe(3);
  });

  test("falls back to the first active status, then the first one", () => {
    expect(defaultQuoteStatus([{ id: 1, status: 0 }, { id: 2, status: 1 }])!.id).toBe(2);
    expect(defaultQuoteStatus([{ id: 1, status: 0 }])!.id).toBe(1);
    expect(defaultQuoteStatus([])).toBeUndefined();
  });
});

describe("servicesStepErrors", () => {
  const complete = {
    requiresGoodsValue: true,
    amount: 1500,
    destinationTransport: true,
    idTown: 7,
    hasTowns: true,
  };

  test("no errors when the value and district are given", () => {
    expect(servicesStepErrors(complete)).toEqual({ amount: "", town: "" });
  });

  test("a missing district is reported on the district, not on the goods value", () => {
    const errors = servicesStepErrors({ ...complete, requiresGoodsValue: false, amount: "", idTown: null });
    expect(errors.amount).toBe("");
    expect(errors.town).not.toBe("");
  });

  test("the district is not required when the destination has no districts", () => {
    expect(servicesStepErrors({ ...complete, idTown: null, hasTowns: false }).town).toBe("");
  });

  test("the district is not required without destination transport", () => {
    expect(servicesStepErrors({ ...complete, destinationTransport: false, idTown: null }).town).toBe("");
  });

  test.each(["", 0, -5, null])("a goods value of %p is reported when a service needs it", (amount) => {
    expect(servicesStepErrors({ ...complete, amount }).amount).not.toBe("");
    expect(servicesStepErrors({ ...complete, amount, requiresGoodsValue: false }).amount).toBe("");
  });
});

describe("blockedQuoteSave", () => {
  const pricing = (tiempo_transito: number) => ({
    opcionCostos: [{ nro_propuesta: 1, tiempo_transito, listCostos: [], listImpuestos: [], listNotasQuote: [] }],
    datosPrincipales: { containers: null },
    listMultiplicador: [],
  });

  test("lets a valid quote through without a warning", () => {
    vi.mocked(Swal.fire).mockClear();
    expect(blockedQuoteSave(pricing(30))).toBe(false);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("blocks an invalid quote and tells the user what to fix", () => {
    vi.mocked(Swal.fire).mockClear();
    expect(blockedQuoteSave(pricing(2.5))).toBe(true);
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "warning", text: expect.stringContaining("opción 1") }));
  });
});

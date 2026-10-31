import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useCalculadorasStore } from "@/stores/calculadoras";
import { accepted, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const previousQuote = [{ id_distrito: 7, opcion: 1, peso_desde: 0, peso_hasta: 500, tarifadolar: 80 }];

describe("transport tariffs for a quote", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 3, id_pais: 139 }]));
  });

  test("keeps the tariffs the new query returns", async () => {
    respond({ "calc/transporte": accepted([{ id_distrito: 9 }]) });
    const calc = useCalculadorasStore();

    await calc.getTransporte({ shimpent: "LCL", id_modality: 1 });

    expect(calc.lstTransporte).toEqual([{ id_distrito: 9 }]);
  });

  test.each([
    ["finds no tariffs", rejected()],
    ["fails", new Error("Network Error")],
  ])("drops the previous quote's tariffs when the new query %s", async (_, answer) => {
    respond({ "calc/transporte": answer });
    const calc = useCalculadorasStore();
    calc.lstTransporte = previousQuote;

    await calc.getTransporte({ shimpent: "FCL", id_modality: 2 });

    expect(calc.lstTransporte).toEqual([]);
  });

  test("drops the previous tariffs as soon as a new query starts", () => {
    respond({ "calc/transporte": accepted([]) });
    const calc = useCalculadorasStore();
    calc.lstTransporte = previousQuote;

    void calc.getTransporte({ shimpent: "LCL", id_modality: 1 });

    expect(calc.lstTransporte).toEqual([]);
  });
});

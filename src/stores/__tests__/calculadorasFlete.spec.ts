import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useCalculadorasStore } from "@/stores/calculadoras";
import { accepted, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

describe("calculator freight for a quote route", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  });

  test.each([
    ["no freight row", accepted([])],
    ["a refusal", rejected()],
    ["a network failure", new Error("Network Error")],
  ])("leaves no freight, without failing, after %s", async (_, answer) => {
    respond({ "calc/flete/obtener_flete": answer });
    const calc = useCalculadorasStore();
    calc.fletePricing = { monto_flete: "999.00" };

    await calc.obtenerFleteCalculadora({ shipment: "LCL" });

    expect(calc.fletePricing).toEqual({});
  });
});

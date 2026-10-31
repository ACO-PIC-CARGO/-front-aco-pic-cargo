import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { usePricingStore } from "@/stores/pricing";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";
import type { Costo, OpcionCosto } from "@/types/cotizacion";
import { URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), showLoading: vi.fn(), close: vi.fn() } }));

const saleFreight = (costounitario: number): Costo => ({
  nameservice: "FLETE",
  esfleteflag: 1,
  esventaflag: 1,
  status: 1,
  id_multiplicador: 1,
  costounitario,
});
const option = (nro_propuesta: number, flete: number): OpcionCosto => ({
  nro_propuesta,
  tiempo_transito: 30,
  selected: true,
  listCostos: [saleFreight(flete)],
  listImpuestos: [{ id: 2, codigo: "02", codigo01: 0, descripcion: "FLETE" }],
  listNotasQuote: [],
});

function quote() {
  const pricing = usePricingStore();
  pricing.listMultiplicador = [{ id: 1, code: 1, valor: 1 }];
  pricing.listServices = [{ id: 5, service: "IMPUESTOS", code_service: 15, status: true }];
  pricing.listShipment = [{ id: 3, code: "LCL", embarque: "LCL" }];
  pricing.datosPrincipales = { idtipocarga: 3, volumen: 2, peso: 100, amount: 1000, containers: [] };
  pricing.opcionCostos = [option(1, 100), option(2, 300)];
  pricing.totalFlete = 999;
  return pricing;
}

const sentOptions = (path: string) =>
  (httpMock.mock.calls.find(([config]) => config.url === URL_MAIN + path)![0].data as {
    opcionCostos: { nro_propuesta: number; listImpuestos: { name: string; valor: string }[] }[];
  }).opcionCostos;

describe("saving a quote", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 1 }]));
  });

  test("registrarQuote keeps the new quote number when the backend accepts it", async () => {
    respond({ setQuote: { ...accepted([]), insertId: 501, nro_quote: "15000-P", msg: "Cotización ingresada con el número 15000-P" } });
    const pricing = quote();

    const answer = await pricing.registrarQuote({ fullflag: false });

    expect(answer.estadoflag).toBe(true);
    expect([pricing.id, pricing.nro_quote, pricing.mensaje]).toEqual([501, "15000-P", "Cotización ingresada con el número 15000-P"]);
  });

  test.each([
    ["a refused quote", rejected("Falta el puerto de destino. Elígelo y vuelve a guardar."), "Falta el puerto de destino. Elígelo y vuelve a guardar."],
    ["a server or network failure", new Error("Network Error"), CONNECTION_ERROR_MESSAGE],
  ])("registrarQuote reports %s without a quote number", async (_, body, message) => {
    respond({ setQuote: body });
    const pricing = quote();

    const answer = await pricing.registrarQuote({ fullflag: true });

    expect(answer).toMatchObject({ estadoflag: false, mensaje: message });
    expect(pricing.nro_quote).toBe("");
  });

  test("registrarQuote saves each option's taxes with that option's own sale freight", async () => {
    respond({ setQuote: { ...accepted([]), insertId: 1, nro_quote: "1-P", msg: "ok" } });

    await quote().registrarQuote({ fullflag: false });

    expect(sentOptions("setQuote").map((o) => [o.nro_propuesta, o.listImpuestos[0]!.valor])).toEqual([
      [1, "100.00"],
      [2, "300.00"],
    ]);
  });

  test("updateQuote saves each option's taxes with that option's own sale freight", async () => {
    respond({ putQuote: accepted([]) });

    await quote().updateQuote();

    expect(sentOptions("putQuote").map((o) => [o.nro_propuesta, o.listImpuestos[0]!.valor])).toEqual([
      [1, "100.00"],
      [2, "300.00"],
    ]);
  });

  test("updateQuote tells the caller the quote was saved", async () => {
    respond({ putQuote: accepted([]) });

    expect(await quote().updateQuote()).toBe(true);
  });

  test.each([
    ["a refused update", rejected("La cotización ya fue aprobada. Pide que la reabran para editarla."), "La cotización ya fue aprobada. Pide que la reabran para editarla."],
    ["a server or network failure", new Error("Network Error"), CONNECTION_ERROR_MESSAGE],
  ])("updateQuote reports %s so nothing else runs", async (_, body, message) => {
    respond({ putQuote: body });

    expect(await quote().updateQuote()).toBe(false);
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error", text: message }));
  });
});

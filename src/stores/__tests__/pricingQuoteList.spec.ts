import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { usePricingStore } from "@/stores/pricing";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";
import { URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), showLoading: vi.fn(), close: vi.fn() } }));

const requestTo = (path: string) =>
  httpMock.mock.calls.map(([config]) => config).find((config) => config.url.slice(URL_MAIN.length).split("?")[0] === path);

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  sessionStorage.clear();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("quote list", () => {
  test("a range without quotes empties the table without an error dialog", async () => {
    respond({ getQuoteList: rejected() });
    const pricing = usePricingStore();
    pricing.listQuotes = [{ id: 1 }];

    await pricing.getListQuote();

    expect(pricing.listQuotes).toEqual([]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("a list that cannot be loaded drops the previous rows and says what to do", async () => {
    httpMock.mockRejectedValue(new Error("Network Error"));
    const pricing = usePricingStore();
    pricing.listQuotes = [{ id: 1 }];

    await pricing.getListQuote();

    expect(pricing.listQuotes).toEqual([]);
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error", text: CONNECTION_ERROR_MESSAGE }));
  });

  test("the status totals are counted with the same filters as the list", async () => {
    respond({ getQuoteList: accepted([{ id: 9 }]), resumen_por_estado: accepted([{ id: 3, cantidad: "1" }]) });
    const pricing = usePricingStore();
    pricing.filtro = { fechainicio: "2026-10-01", fechafin: "2026-10-31", tipopdf: 1, id_status: 3, id_cliente: null, estado: "1" };

    await pricing.reloadQuoteList();

    expect(requestTo("resumen_por_estado")!.params).toEqual(requestTo("getQuoteList")!.params);
    expect(requestTo("resumen_por_estado")!.params).toMatchObject({ fechainicio: "2026-10-01", fechafin: "2026-10-31", id_status: 3, estado: "1" });
    expect(requestTo("resumen_por_estado")!.params).not.toHaveProperty("id_cliente");
    expect(pricing.listadoResumen).toEqual([{ id: 3, cantidad: "1" }]);
  });

  test("status totals that cannot be loaded are not left from a previous filter", async () => {
    respond({ resumen_por_estado: new Error("Network Error") });
    const pricing = usePricingStore();
    pricing.listadoResumen = [{ id: 3, cantidad: "8" }];

    await pricing.getResumenPorEstado();

    expect(pricing.listadoResumen).toEqual([]);
  });

  test("a deleted quote is confirmed only when the server deleted it", async () => {
    respond({ delQuote: accepted([]) });

    expect(await usePricingStore().eliminarRegistro(5)).toBe(true);

    expect(requestTo("delQuote")).toMatchObject({ method: "post", data: { id: 5 } });
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "success" }));
  });

  test.each([
    ["the server refuses", { response: { data: { estadoflag: false, mensaje: "La cotización ya está aprobada." } } }, "La cotización ya está aprobada."],
    ["the server cannot be reached", new Error("Network Error"), CONNECTION_ERROR_MESSAGE],
  ])("a delete that %s is not confirmed and says why", async (_case, failure, reason) => {
    httpMock.mockRejectedValue(failure);

    expect(await usePricingStore().eliminarRegistro(5)).toBe(false);

    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error", text: reason }));
    expect(Swal.fire).not.toHaveBeenCalledWith(expect.objectContaining({ icon: "success" }));
  });

  test("a registered call is confirmed only when the server saved it", async () => {
    respond({ setCalls: accepted([]) });
    const call = { id_quote: 5, comentario: "Llamó", id_status: 3 };

    expect(await usePricingStore().guardarNotaQuote(call)).toBe(true);

    expect(requestTo("setCalls")).toMatchObject({ method: "post", data: call });
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "success" }));
  });

  test("a call the server refuses is not confirmed and says why", async () => {
    respond({ setCalls: { estadoflag: false, mensaje: "No puedes cambiar el estado de una cotización aprobada.", tipomensaje: "TMSGERR" } });

    expect(await usePricingStore().guardarNotaQuote({ id_quote: 5 })).toBe(false);

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: "error", text: "No puedes cambiar el estado de una cotización aprobada." }),
    );
  });

  test("clearing the filters goes back to this year's active quotes and drops every other filter", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 15));
    const pricing = usePricingStore();
    pricing.filtro = {
      fechainicio: "2026-03-01",
      fechafin: "2026-03-31",
      tipopdf: 2,
      id_cliente: 9,
      id_pricing: 4,
      id_status: 3,
      id_masterdetalletemperaturaventa: 2,
      fechaemisiondesde: "2026-03-01",
      fechaemisionhasta: "2026-03-02",
      estado: "0",
    };

    pricing.resetQuoteFilter();

    expect(pricing.filtro).toEqual({ fechainicio: "2026-01-01", fechafin: "2026-10-31", tipopdf: 1, estado: "1" });
  });
});

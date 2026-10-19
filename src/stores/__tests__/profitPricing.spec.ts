import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useProfitPricingStore } from "@/stores/profitPricing";
import { JSON_HEADERS, URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const individual = { id: 1, id_proveedor: 4, concepto: "FLETE", profitprimeraimportacion: 10, estado: true, esfleteflag: true };
const grupal = { id: 2, id_proveedor: 5, concepto: "ALMACEN", profitsegundaimportacion: 3, estado: false, esalmacenflag: true };

function selectedProfit() {
  const store = useProfitPricingStore();
  store.id_shipment = 2;
  store.id_incoterms = 6;
  store.id_modality = 1;
  return store;
}

describe("profitPricing store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("getProfitPricing sends the selected shipment, incoterm and modality and splits the first row into the two lists", async () => {
    respond({ profit_pricing_listado: accepted([{ profitindividual: [individual], profitgrupal: [grupal] }]) });
    const store = selectedProfit();

    await store.getProfitPricing();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "profit_pricing_listado",
      params: { id_shipment: 2, id_incoterms: 6, id_modality: 1 },
      headers: JSON_HEADERS,
    });
    expect(store.lstProfigIndividual).toEqual([individual]);
    expect(store.lstProfigGrupal).toEqual([grupal]);
  });

  test("getProfitPricing leaves both lists undefined when the backend rejects, because it reads them off an empty array", async () => {
    respond({ profit_pricing_listado: rejected() });
    const store = selectedProfit();

    await store.getProfitPricing();

    expect(store.lstProfigIndividual).toBeUndefined();
    expect(store.lstProfigGrupal).toBeUndefined();
  });

  test("getProfitPricing logs the error and keeps the lists when an accepted answer has no rows", async () => {
    respond({ profit_pricing_listado: accepted([]) });
    const store = selectedProfit();
    store.lstProfigIndividual = [individual];

    await store.getProfitPricing();

    expect(console.error).toHaveBeenCalledWith(expect.any(TypeError));
    expect(store.lstProfigIndividual).toEqual([individual]);
    expect(store.lstProfigGrupal).toEqual([]);
  });

  test("getProfitPricingCostos sends the selection and keeps the concepts, or empties them on a rejection", async () => {
    respond({ profit_pricing_listado_costos: accepted([{ id: 9, concepto: "FLETE" }]) });
    const store = selectedProfit();

    await store.getProfitPricingCostos();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "profit_pricing_listado_costos",
      params: { id_shipment: 2, id_incoterms: 6, id_modality: 1 },
      headers: JSON_HEADERS,
    });
    expect(store.lstCostosAsignarProfit).toEqual([{ id: 9, concepto: "FLETE" }]);

    respond({ profit_pricing_listado_costos: rejected() });
    await store.getProfitPricingCostos();

    expect(store.lstCostosAsignarProfit).toEqual([]);
  });

  test("getProfitPricingCostos logs a failed request and keeps the concepts", async () => {
    respond({ profit_pricing_listado_costos: new Error("network") });
    const store = selectedProfit();
    store.lstCostosAsignarProfit = [{ id: 9, concepto: "FLETE" }];

    await store.getProfitPricingCostos();

    expect(console.error).toHaveBeenCalledWith(new Error("network"));
    expect(store.lstCostosAsignarProfit).toEqual([{ id: 9, concepto: "FLETE" }]);
  });

  test("setProfitPricingCostos posts both lists with the selection and shows the success message", async () => {
    respond({ profit_pricing_costos_set: accepted([]) });
    const store = selectedProfit();
    store.lstProfigIndividual = [individual];
    store.lstProfigGrupal = [grupal];

    await store.setProfitPricingCostos();

    expect(httpMock).toHaveBeenCalledWith({
      method: "post",
      url: URL_MAIN + "profit_pricing_costos_set",
      data: {
        lstProfigIndividual: [individual],
        lstProfigGrupal: [grupal],
        id_shipment: 2,
        id_incoterms: 6,
        id_modality: 1,
      },
      headers: JSON_HEADERS,
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok" });
  });

  test("setProfitPricingCostos only logs the message of a rejection", async () => {
    respond({ profit_pricing_costos_set: rejected("No se pudo guardar") });

    await selectedProfit().setProfitPricingCostos();

    expect(Swal.fire).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith("No se pudo guardar");
  });
});

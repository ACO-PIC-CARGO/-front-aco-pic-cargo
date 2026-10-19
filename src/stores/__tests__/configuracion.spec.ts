import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useConfiguracionStore } from "@/stores/configuracion";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

describe("configuracion store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  test("getCargarCostos keeps whatever rows the backend answers, without looking at estadoflag", async () => {
    respond({ costo_pricing: rejected() });
    const store = useConfiguracionStore();
    store.lstCostos = [{ id: 9 }];

    await store.getCargarCostos({ id_modality: 1, id_shipment: 2, id_incoterms: 3 });

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "costo_pricing",
      params: { id_modality: 1, id_shipment: 2, id_incoterms: 3 },
      headers: JSON_HEADERS,
    });
    expect(store.lstCostos).toEqual([]);
  });

  test("getCargarCostos stores the rows of an accepted answer", async () => {
    respond({ costo_pricing: accepted([{ id: 1, costo: "A" }]) });
    const store = useConfiguracionStore();

    await store.getCargarCostos({ id_modality: 1, id_shipment: 2, id_incoterms: 3 });

    expect(store.lstCostos).toEqual([{ id: 1, costo: "A" }]);
  });

  test("a failed request keeps the list and logs the error", async () => {
    respond({ costo_pricing: new Error("offline") });
    const store = useConfiguracionStore();
    store.lstCostos = [{ id: 9 }];

    await store.getCargarCostos({ id_modality: 1, id_shipment: 2, id_incoterms: 3 });

    expect(store.lstCostos).toEqual([{ id: 9 }]);
    expect(console.error).toHaveBeenCalledWith(new Error("offline"));
  });

  test("obtenerServicioPricingConfig stamps the session branch on the filters and stores the services", async () => {
    respond({ obtener_servicio_pricing_config: accepted([{ id: 4, service: "THC" }]) });
    const store = useConfiguracionStore();
    const filters = { id_modality: 1, id_shipment: 2, id_incoterms: 3 };

    await store.obtenerServicioPricingConfig(filters);

    expect(filters).toEqual({ id_modality: 1, id_shipment: 2, id_incoterms: 3, id_branch: 7 });
    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "obtener_servicio_pricing_config",
      params: filters,
      headers: JSON_HEADERS,
    });
    expect(store.lstServicios).toEqual([{ id: 4, service: "THC" }]);
  });

  test("obtenerServicioPricingConfig rejects when there is no session", async () => {
    sessionStorage.clear();
    const store = useConfiguracionStore();

    await expect(store.obtenerServicioPricingConfig({ id_modality: 1, id_shipment: 2, id_incoterms: 3 })).rejects.toThrow();
    expect(httpMock).not.toHaveBeenCalled();
  });

  test("getMultiplicadorConfigCosto asks for the shipment with the session branch and keeps accepted rows", async () => {
    respond({ cargar_multiplicador_config_costo: accepted([{ id: 1, name: "BL" }]) });
    const store = useConfiguracionStore();

    await store.getMultiplicadorConfigCosto(5);

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "cargar_multiplicador_config_costo",
      params: { id_shipment: 5, containers: [], id_branch: 7 },
      headers: JSON_HEADERS,
    });
    expect(store.lstMultiplicador).toEqual([{ id: 1, name: "BL" }]);
  });

  test("getMultiplicadorConfigCosto empties the list when the backend rejects", async () => {
    respond({ cargar_multiplicador_config_costo: rejected() });
    const store = useConfiguracionStore();
    store.lstMultiplicador = [{ id: 1 }];

    await store.getMultiplicadorConfigCosto(5);

    expect(store.lstMultiplicador).toEqual([]);
  });

  test.each([
    ["setGuardarCostos", "put", "costo_pricing_actualizar", { lstCostos: [], id_incoterms: 3 }],
    ["EliminarCosto", "delete", "costo_eliminar", { id: 4 }],
  ] as const)("%s sends the data and tells the user how it went", async (action, method, path, data) => {
    respond({ [path]: { ...accepted([]), mensaje: "Hecho" } });
    const store = useConfiguracionStore();

    await store[action](data as never);

    expect(httpMock).toHaveBeenCalledWith({ method, url: URL_MAIN + path, data, headers: JSON_HEADERS });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "Hecho" });
  });

  test("setGuardarCostos shows the error icon when the backend rejects", async () => {
    respond({ costo_pricing_actualizar: rejected("Sin permiso") });
    const store = useConfiguracionStore();

    await store.setGuardarCostos({ lstCostos: [], id_incoterms: 3 });

    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "Sin permiso" });
  });

  test("getTextWhatsapp stores the id and both texts of the first row", async () => {
    const lcl = { pdfindividual: "a" };
    const fcl = [{ id_container: 1, texto: { pdfindividual: "b" } }];
    respond({ text_whatsapp: accepted([{ id: 3, lcl, fcl }]) });
    const store = useConfiguracionStore();

    await store.getTextWhatsapp();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "text_whatsapp",
      params: { id_branch: 7 },
      headers: JSON_HEADERS,
    });
    expect([store.id, store.lcl, store.fcl]).toEqual([3, lcl, fcl]);
  });

  test("getTextWhatsapp falls back to empty texts when the row has none or the backend rejects", async () => {
    respond({ text_whatsapp: accepted([{ id: 3 }]) });
    const store = useConfiguracionStore();

    await store.getTextWhatsapp();
    expect([store.id, store.lcl, store.fcl]).toEqual([3, {}, {}]);

    respond({ text_whatsapp: rejected() });
    await store.getTextWhatsapp();
    expect([store.id, store.lcl, store.fcl]).toEqual([undefined, {}, {}]);
  });

  test("getTextWhatsapp keeps the previous texts when an accepted answer has no rows", async () => {
    respond({ text_whatsapp: accepted([]) });
    const store = useConfiguracionStore();
    store.lcl = { pdfindividual: "kept" };

    await store.getTextWhatsapp();

    expect(store.lcl).toEqual({ pdfindividual: "kept" });
    expect(console.error).toHaveBeenCalledOnce();
  });

  test.each([
    ["setTextoWhatsappLCL", "text_whatsapp_lcl", { lcl: { pdfindividual: "x" } }],
    ["setTextoWhatsappFCL", "text_whatsapp_fcl", { fcl: [] }],
  ] as const)("%s stamps the loaded id and the session branch on the body", async (action, path, data) => {
    respond({ text_whatsapp: accepted([{ id: 3 }]), [path]: { ...accepted([]), mensaje: "Guardado" } });
    const store = useConfiguracionStore();
    await store.getTextWhatsapp();
    httpMock.mockClear();
    const body: Record<string, unknown> = { ...data };

    await store[action](body as never);

    expect(body).toEqual({ ...data, id: 3, id_branch: 7 });
    expect(httpMock).toHaveBeenCalledWith({ method: "put", url: URL_MAIN + path, data: body, headers: JSON_HEADERS });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "Guardado" });
  });

  test("ObtenerIncotermsConfigCostos stamps the session branch and keeps accepted rows", async () => {
    respond({ incoterms_config_costos: accepted([{ id: 8, name: "FOB" }]) });
    const store = useConfiguracionStore();
    const filters = { id_modality: 1, id_shipment: 2 };

    await store.ObtenerIncotermsConfigCostos(filters);

    expect(filters).toEqual({ id_modality: 1, id_shipment: 2, id_branch: 7 });
    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "incoterms_config_costos",
      params: filters,
      headers: JSON_HEADERS,
    });
    expect(store.lstIncoterms).toEqual([{ id: 8, name: "FOB" }]);
  });

  test("ObtenerIncotermsConfigCostos empties the list when the backend rejects", async () => {
    respond({ incoterms_config_costos: rejected() });
    const store = useConfiguracionStore();
    store.lstIncoterms = [{ id: 8 }];

    await store.ObtenerIncotermsConfigCostos({ id_modality: 1, id_shipment: 2 });
    await flushPromises();

    expect(store.lstIncoterms).toEqual([]);
  });
});

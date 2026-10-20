import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { toRaw } from "vue";
import { useAduanaStore } from "@/stores/aduana";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";
import { usePricingStore } from "@/stores/pricing";
import { accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(() => Promise.resolve({ isConfirmed: false })) } }));

type Aduana = ReturnType<typeof useAduanaStore>;
type Pricing = ReturnType<typeof usePricingStore>;
type SharedList =
  | "listEjecutivo"
  | "preServices"
  | "preCostos"
  | "listImpuestos"
  | "listNotasQuote"
  | "listCostos"
  | "listServices"
  | "copylistServices"
  | "listMultiplicador"
  | "listTipoCostos"
  | "namesection"
  | "listModality"
  | "listShipment"
  | "listIncoterms"
  | "listPortBegin"
  | "listPortEnd"
  | "listInstructivo";

describe("aduana and pricing keep the lists they shared while both were Vuex modules", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.spyOn(console, "error").mockImplementation(() => {});
    sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1 }]));
  });

  test.each<[string, string, (aduana: Aduana) => Promise<void> | void, SharedList[]]>([
    ["SET_LIST_EJECUTIVO", "get_personal_pricing", (a) => a.getPersonalPricingAduana(), ["listEjecutivo"]],
    ["PRE_SERVICES", "obtenerListadoServiciosAduanaQuote", (a) => a.getServicesAduana(), ["preServices"]],
    ["PRE_COSTOS", "obtener_costos_pricing", (a) => a.obtenerCostosAduana(), ["preCostos"]],
    ["SET_LIST_SERVICES", "getItemsServices", (a) => a.getItemsServices(), ["listServices", "copylistServices"]],
    ["SET_MULTPLICADOR", "getMultiplicador", (a) => a.getMultiplicadorAduana(), ["listMultiplicador"]],
    ["SET_TIPO_COSTOS", "tipo_costo_x_embarque", (a) => a.getTipoCostosAduana(), ["listTipoCostos", "namesection"]],
    ["SET_LIST_MODALITY", "getModality", (a) => a.getModalityAduana(), ["listModality"]],
    ["SET_LIST_SHIPMENT", "getShipment", (a) => a.getShipmentAduana(), ["listShipment"]],
    ["SET_LIST_INCOTERMS", "getIncoterms", (a) => a.getIncotermsAduana(), ["listIncoterms"]],
    ["SET_LIST_PORT_BEGIN", "getPortBegin", (a) => a.getPortBeginAduana({}), ["listPortBegin"]],
    ["SET_LIST_PORT_END", "getPortEnd", (a) => a.getPortEndAduana({}), ["listPortEnd"]],
    ["SET_CARGAR_NOTAS_COTIZACION", "cargar_master_detalle_notas_cotizacion", (a) => a.getCargarMasterDetalleNotasCotizacionAduana(), ["listNotasQuote"]],
    ["setInstructivo", "getInstructivoIdAduana/14", (a) => a.getInstructivoIdAduana({ id: 14 }), ["listInstructivo"]],
  ])("%s from an aduana loader hands the same rows to pricing", async (_, path, load, keys) => {
    respond({ [path]: accepted([{ id: 1, name: "X", codigo: "FL" }]) });
    const aduana = useAduanaStore();
    const pricing = usePricingStore();

    await load(aduana);
    await flushPromises();

    expect(aduana[keys[0]!]).toHaveLength(1);
    for (const key of keys) expect(toRaw(pricing[key])).toBe(toRaw(aduana[key]));
  });

  test("SET_MULTPLICADOR and SET_TIPO_COSTOS from aduana also reach configEmpresa", async () => {
    respond({ getMultiplicador: accepted([{ id: 1, name: "X" }]), tipo_costo_x_embarque: accepted([{ codigo: "FL", name: "FLETE" }]) });
    const aduana = useAduanaStore();

    await aduana.getMultiplicadorAduana();
    await aduana.getTipoCostosAduana();

    expect(toRaw(useConfigEmpresaStore().lstMultiplicador)).toBe(toRaw(aduana.listMultiplicador));
    expect(toRaw(useConfigEmpresaStore().listTipoCostos)).toBe(toRaw(aduana.listTipoCostos));
  });

  test.each<[string, (aduana: Aduana) => Promise<void>]>([
    ["listar_aduana", (a) => a.getListQuoteAduana()],
    ["obtener_aduana_unificar", (a) => a.getAduanaUnificar(14)],
    ["obtener_cotizacion_unificar", (a) => a.getCotizacionUnificar(14)],
  ])("SET_LIST_QUOTES from %s keeps aduana's rows and gives pricing the rows keyed by id and position", async (path, load) => {
    respond({ [path]: accepted([{ id: 9 }, { code: "A" }]) });
    const aduana = useAduanaStore();

    await load(aduana);

    expect(usePricingStore().listQuotes).toEqual(aduana.listQuotes.map((row, i) => ({ ...row, rowId: i ? "quote_1" : "9_0" })));
  });

  test("getQuoteCallAduana fills pricing's calls list, keyed like pricing's own loader, or empties it on a rejection", async () => {
    respond({ list_calls_aduana: accepted([{ id: 7 }, { id: 7 }]) });
    const aduana = useAduanaStore();

    await aduana.getQuoteCallAduana({});
    expect(usePricingStore().listCall).toEqual([
      { id: 7, rowId: "7_0" },
      { id: 7, rowId: "7_1" },
    ]);

    respond({ list_calls_aduana: rejected() });
    await aduana.getQuoteCallAduana({});
    await flushPromises();
    expect(usePricingStore().listCall).toEqual([]);
  });

  test.each<[string, string, (pricing: Pricing) => Promise<void> | void, SharedList[]]>([
    ["SET_LIST_EJECUTIVO", "get_personal_pricing", (p) => p.getPersonalPricing(), ["listEjecutivo"]],
    ["PRE_SERVICES", "obtener_servicio_pricing", (p) => p.getServices(), ["preServices"]],
    ["PRE_COSTOS", "obtener_costos_pricing", (p) => p.obtenerCostosPricing(), ["preCostos"]],
    ["SET_CARGAR_IMPUESTOS", "cargar_master_detalle_impuesto", (p) => p.getImpuestos(), ["listImpuestos"]],
    ["SET_CARGAR_NOTAS_COTIZACION", "cargar_master_detalle_notas_cotizacion", (p) => p.getCargarMasterDetalleNotasCotizacion(), ["listNotasQuote"]],
    ["SET_LIST_SERVICES", "getItemsServices", (p) => p.getItemsServices(), ["listServices", "copylistServices"]],
    ["SET_MULTPLICADOR", "getMultiplicador", (p) => p.getMultiplicador(), ["listMultiplicador"]],
    ["SET_TIPO_COSTOS", "tipo_costo_x_embarque", (p) => p.getTipoCostos(), ["listTipoCostos", "namesection"]],
    ["SET_LIST_MODALITY", "getModality", (p) => p.getModality(), ["listModality"]],
    ["SET_LIST_SHIPMENT", "getShipment", (p) => p.getShipment(), ["listShipment"]],
    ["SET_LIST_INCOTERMS", "getIncoterms", (p) => p.getIncoterms(), ["listIncoterms"]],
    ["SET_LIST_PORT_BEGIN", "getPortBegin", (p) => p.getPortBegin({}), ["listPortBegin"]],
    ["SET_LIST_PORT_END", "getPortEnd", (p) => p.getPortEnd({}), ["listPortEnd"]],
    ["setInstructivo", "getInstructivoId/12895", (p) => p.getInstructivoId({ id: 12895 }), ["listInstructivo"]],
  ])("%s from a pricing loader hands the same rows to aduana", async (_, path, load, keys) => {
    respond({ [path]: accepted([{ id: 1, name: "X", codigo: "FL" }]) });
    const aduana = useAduanaStore();
    const pricing = usePricingStore();

    await load(pricing);
    await flushPromises();

    expect(pricing[keys[0]!]).toHaveLength(1);
    for (const key of keys) expect(toRaw(aduana[key])).toBe(toRaw(pricing[key]));
  });

  test("SET_LIST_SERVICES from pricing's getItemsServices reaches aduana even when aduana's own request fails", async () => {
    const rows = [{ id: 1, service: "FLETE" }];
    httpMock.mockClear();
    httpMock.mockResolvedValueOnce({ data: accepted(rows) }).mockRejectedValueOnce(new Error("network"));
    const pricing = usePricingStore();
    const aduana = useAduanaStore();

    await pricing.getItemsServices();

    expect(httpMock).toHaveBeenCalledTimes(2);
    expect(toRaw(pricing.listServices)).toBe(rows);
    for (const key of ["listServices", "copylistServices"] as const) expect(toRaw(aduana[key])).toBe(rows);
  });

  test("SET_LIST_QUOTES from a pricing loader gives aduana the same rows", async () => {
    respond({ getQuoteList: accepted([{ id: 9 }, { code: "A" }]) });
    const pricing = usePricingStore();

    await pricing.getListQuote();

    expect(pricing.listQuotes).toHaveLength(2);
    expect(useAduanaStore().listQuotes).toEqual(pricing.listQuotes);
  });
});

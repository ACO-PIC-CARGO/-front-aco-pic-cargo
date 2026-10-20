import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { toRaw } from "vue";
import Swal from "sweetalert2";
import http from "@/api/http";
import router from "@/router";
import store from "@/store";
import { useAduanaStore } from "@/stores/aduana";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";
import { useEnterprisesStore } from "@/stores/enterprises";
import { useControlGastosStore } from "@/stores/controlGastos";
import { useFilesStore } from "@/stores/files";
import { useHousesStore } from "@/stores/houses";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { getNombreCotizacion, usePricingStore } from "@/stores/pricing";
import type { Costo, DatosPrincipales, Impuesto, Multiplicador, Nota, OpcionCosto, Servicio } from "@/types/cotizacion";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("@/store", () => ({ default: { state: {}, commit: vi.fn(), dispatch: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), showLoading: vi.fn(), close: vi.fn() } }));

const rootState = store.state as Record<string, unknown>;
const postMock = vi.mocked((http as unknown as { post: (...a: unknown[]) => Promise<unknown> }).post);
const postedBody = (path: string) => postMock.mock.calls.find(([url]) => url === URL_MAIN + path)?.[1];
const sentConfig = (path: string) => httpMock.mock.calls.find(([config]) => config.url.slice(URL_MAIN.length).split("?")[0] === path)?.[0];

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const MULTIPLICADORES: Multiplicador[] = [
  { id: 1, code: 1, valor: 1, text: "Por embarque", name: "Por embarque" },
  { id: 2, code: 2, valor: "1", text: "Por m3", name: "Por m3" },
  { id: 3, code: 3, valor: 1, text: "W/M", name: "W/M" },
  { id: 4, code: 4, valor: 1, text: "Por tonelada", name: "Por tonelada" },
  { id: 5, code: 5, valor: 1, text: "% Seguro", name: "% Seguro" },
  { id: 13, code: 13, valor: 1, text: "% CIF", name: "% CIF" },
];
const COSTOS: Costo[] = [
  { id: 11, nameservice: "FLETE INTERNACIONAL", esfleteflag: 1, esventaflag: 1, esopcionflag: 0, status: 1, id_multiplicador: 3, costounitario: 50, code_cost: 1, id_groupservices: 4 },
  { id: 12, nameservice: "GASTOS EN ORIGEN", esorigenflag: 1, esventaflag: 1, esopcionflag: 0, status: 1, id_multiplicador: 1, costounitario: 120.5, code_cost: 2, id_groupservices: 4 },
  { id: 13, nameservice: "VISTOS BUENOS", eslocalflag: 1, esventaflag: 1, esopcionflag: 0, status: 1, id_multiplicador: 2, costounitario: "35", minimo: 100, considerarvalorminimoflag: true, code_cost: 3, id_groupservices: 7 },
  { id: 14, nameservice: "COMISION AGENCIA", esaduanaflag: 1, esventaflag: 1, esopcionflag: 0, status: 1, id_multiplicador: 13, costounitario: 1, cif: 0.35, seguro: 0.45, minimo: 118, code_cost: 6, id_groupservices: 7 },
  { id: 15, nameservice: "ALMACEN", esalmacenflag: 1, esventaflag: 1, esopcionflag: 0, status: 1, id_multiplicador: 4, costounitario: 80, code_cost: 4, id_groupservices: 9 },
  { id: 16, nameservice: "SEGURO DE CARGA", esgastostercerosflag: 1, esventaflag: 1, esopcionflag: 0, status: 1, id_multiplicador: 5, costounitario: 1, cif: 0.35, seguro: 0.45, code_cost: 15, id_groupservices: 9 },
  { id: 17, nameservice: "FLETE INACTIVO", esfleteflag: 1, esventaflag: 1, esopcionflag: 0, status: 0, id_multiplicador: 3, costounitario: 999, code_cost: 1 },
  { id: 21, nameservice: "FLETE INTERNACIONAL", esfleteflag: 1, esventaflag: 0, esopcionflag: 1, status: 1, id_multiplicador: 3, costounitario: 40, id_proveedor: 40, code_cost: 1, id_groupservices: 4 },
  { id: 22, nameservice: "VISTOS BUENOS", eslocalflag: 1, esventaflag: 0, esopcionflag: 1, status: 1, id_multiplicador: 1, costounitario: 30, id_proveedor: 41, code_cost: 3, id_groupservices: 7 },
  { id: 23, nameservice: "COMISION AGENCIA", esaduanaflag: 1, esventaflag: 0, esopcionflag: 1, status: 1, id_multiplicador: 1, costounitario: 0, id_proveedor: 41, code_cost: 6, id_groupservices: 7 },
];
const IMPUESTOS: Impuesto[] = [
  { id: 1, codigo: "01", codigo01: 0, descripcion: "FOB" },
  { id: 2, codigo: "02", codigo01: 0, descripcion: "FLETE" },
  { id: 3, codigo: "03", codigo01: 1.5, descripcion: "SEGURO" },
  { id: 5, codigo: "05", codigo01: 6, descripcion: "AD VALOREM" },
  { id: 7, codigo: "07", codigo01: 2, descripcion: "IPM" },
  { id: 8, codigo: "08", codigo01: 16, descripcion: "IGV" },
];
const NOTAS: Nota[] = [
  { id: 1, descripcion: "SALIDAS SEMANALES", estado: 1, statusincluye: 1, statusnoincluye: 0 },
  { id: 2, descripcion: "NO INCLUYE SEGURO", estado: 1, statusincluye: 0, statusnoincluye: 1 },
  { id: 3, descripcion: "NOTA INACTIVA", estado: 0, statusincluye: 1, statusnoincluye: 0 },
];
const SERVICIOS: Servicio[] = [
  { id: 1, service: "FLETE", codebegend: "OR", status: 1, code_service: 1, id_begend: 1, id_groupservices: 4 },
  { id: 2, service: "LOCALES", codebegend: "FL", status: true, code_service: 3, id_begend: 2, id_groupservices: 7 },
  { id: 3, service: "ADUANA", codebegend: "DE", status: 0, code_service: 7, id_begend: 3, id_groupservices: 7 },
  { id: 4, service: "ALMACEN", codebegend: "OP", status: 1, code_service: 9, id_begend: 4, id_groupservices: 9 },
  { id: 5, service: "IMPUESTOS", codebegend: "DE", status: 1, code_service: 15, id_begend: 3, id_groupservices: 15 },
];
const DATOS: DatosPrincipales = {
  id: 77,
  idsentido: 1,
  idtipocarga: 3,
  idincoterms: 9,
  idorigen: 207,
  iddestino: 346,
  volumen: 2.5,
  peso: 1200,
  amount: 5000,
  numerobultos: 3,
  containers: [],
  nombre: "ZEVALLOS ALFONSO",
  telefono: "+51997300697",
  id_pricing: 4,
  id_status: 454,
  id_percepcionaduana: 53,
  esindividualflag: true,
  esgrupalflag: false,
  url_folderonedrive: "https://drive/x",
  descripcioncarga: "REPUESTOS",
};
const opcion = (patch: Partial<OpcionCosto> = {}): OpcionCosto => ({
  nro_propuesta: 1,
  date_end: "2026-12-31",
  tiempo_transito: 30,
  selected: true,
  listCostos: clone(COSTOS),
  listImpuestos: clone(IMPUESTOS),
  listNotasQuote: clone(NOTAS),
  ...patch,
});

function cotizacion() {
  const pricing = usePricingStore();
  pricing.listMultiplicador = clone(MULTIPLICADORES);
  pricing.listServices = clone(SERVICIOS);
  pricing.datosPrincipales = clone(DATOS);
  pricing.opcionCostos = [opcion()];
  pricing.listModality = [{ id: 1, code: "I", name: "IMPORTACION" }] as never;
  pricing.listShipment = [
    { id: 3, code: "LCL", embarque: "LCL" },
    { id: 2, code: "FCL", embarque: "FCL" },
  ];
  pricing.listIncoterms = [{ id: 9, name: "FOB" }];
  pricing.listPortBegin = [{ id_port: 207, name: "CALLAO" }];
  pricing.listPortEnd = [{ id_port: 346, name: "SHANGHAI" }];
  pricing.namesection = [
    { codigo: "FL", name: "FLETE" },
    { codigo: "OR", name: "ORIGEN" },
    { codigo: "LO", name: "LOCALES" },
    { codigo: "AD", name: "ADUANA" },
    { codigo: "AL", name: "ALMACEN" },
    { codigo: "GT", name: "GASTOS DE TERCEROS" },
  ];
  pricing.listTipoCostos = clone(pricing.namesection);
  pricing.datosEmpresa = [{ business_name: "PIC LOGISTICA", address: "AV 1", iso_pais: 9589, pais: "PERU", document: "2060", phone: "999" }];
  pricing.listEjecutivo = [{ id_entitie: 4, name: "ANA PRICING" }];
  pricing.listQuoteStatus = [{ id: 454, name: "PRELIMINAR" }];
  pricing.nro_quote = "14779-P";
  pricing.nombre_cotizacion = "COTIZACION LCL";
  return pricing;
}

describe("pricing store", () => {
  let guardarCarpetaHouse: ReturnType<typeof vi.spyOn>;
  let moveFileToOneDrive: ReturnType<typeof vi.spyOn>;
  let imprimirGuardarControlDetallado: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    for (const key of Object.keys(rootState)) if (key !== "pricing" && key !== "listener") delete rootState[key];
    sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1, nombrecompleto: "ANA PRICING", path: "logo.png", users: "ana" }]));
    sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 1, trade_name: "PIC LOGISTICA SAC" }]));
    sessionStorage.setItem("iso_pais", "9589");
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
    postMock.mockResolvedValue({ data: { estadoflag: true, path: "files/x.pdf", mensaje: "ok" } });
    useEnterprisesStore().impuesto = { impuesto: 18, nombre_impuesto: "IGV" };
    guardarCarpetaHouse = vi.spyOn(useHousesStore(), "guardarCarpetaHouse").mockResolvedValue(undefined);
    moveFileToOneDrive = vi.spyOn(useFilesStore(), "moveFileToOneDrive").mockResolvedValue(undefined);
    imprimirGuardarControlDetallado = vi.spyOn(useControlGastosStore(), "imprimirGuardarControlDetallado").mockResolvedValue(undefined);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(window, "open").mockImplementation(() => null);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("lists", () => {
    test("getListQuote sends the filter page with the branch, numbers the rows and hands the raw rows to aduana", async () => {
      const rows = [{ id: 9, code: "Q1" }, { code: "Q2" }];
      respond({ getQuoteList: accepted(rows) });
      const pricing = usePricingStore();
      pricing.filtro = { fechainicio: "2026-01-01", fechafin: "2026-10-31", tipopdf: 1, id_status: 3 };
      pricing.search = "zev";
      pricing.pagina = 2;

      await pricing.getListQuote();

      expect(httpMock).toHaveBeenCalledWith({
        method: "get",
        url: URL_MAIN + "getQuoteList",
        params: { fechainicio: "2026-01-01", fechafin: "2026-10-31", tipopdf: 1, id_status: 3, search: "zev", limit: 10, pagina: 2, id_branch: 1 },
        headers: JSON_HEADERS,
      });
      expect(pricing.listQuotes).toEqual([
        { id: 9, code: "Q1", index: 0, rowId: "9_0" },
        { code: "Q2", index: 1, rowId: "quote_1" },
      ]);
      expect(useAduanaStore().listQuotes).toEqual([
        { id: 9, code: "Q1", index: 0, rowId: "9_0" },
        { code: "Q2", index: 1, rowId: "quote_1" },
      ]);
    });

    test("getListQuote empties the list on a rejection and sends an expired session to Login", async () => {
      vi.useFakeTimers();
      respond({ getQuoteList: rejected("Sesión expirada", "401") });
      const pricing = usePricingStore();
      pricing.listQuotes = [{ id: 1 }];

      await pricing.getListQuote();
      await flushPromises();

      expect(pricing.listQuotes).toEqual([]);
      expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Sesión expirada" });
      expect(router.push).toHaveBeenCalledWith({ name: "Login" });
    });

    test("getQuoteNoAsignadoHouse always empties the quotes, because the answer has no estado field", async () => {
      respond({ quote_cargar_noasignadoshouse: accepted([{ id: 5, code: "E1" }]) });
      const pricing = usePricingStore();

      await pricing.getQuoteNoAsignadoHouse();

      expect(sentConfig("quote_cargar_noasignadoshouse")).toEqual({
        method: "get",
        url: URL_MAIN + "quote_cargar_noasignadoshouse?id_branch=1",
        headers: JSON_HEADERS,
        data: { id_branch: 1 },
      });
      expect(pricing.listQuotes).toEqual([]);
      expect(useAduanaStore().listQuotes).toEqual([]);
    });

    test("ListarMontosFinalesQuoteMONGODB copies the file number into code and stores the token", async () => {
      respond({ listar_montos_finales_quote: accepted([{ id: 3, expediente: "EXP-9" }]) });
      const pricing = usePricingStore();

      await pricing.ListarMontosFinalesQuoteMONGODB();

      expect(sentConfig("listar_montos_finales_quote")!.params).toEqual({ id_branch: 1 });
      expect(pricing.listQuotes).toEqual([{ id: 3, expediente: "EXP-9", code: "EXP-9", rowId: "3_0" }]);
      expect(sessionStorage.getItem("auth-token")).toBe("tok");
    });

    test("getQuoteCall sends the calls filter and keys every row by id and position", async () => {
      respond({ listado_llamadas: accepted([{ id: 4 }, { id: 4 }]) });
      const pricing = usePricingStore();
      pricing.filtroCalls = { fechainicio: "2026-02-01", fechafin: "2026-02-28", tipopdf: 1 };

      await pricing.getQuoteCall({ ignorado: true });

      expect(sentConfig("listado_llamadas")!.params).toEqual({ fechainicio: "2026-02-01", fechafin: "2026-02-28", tipopdf: 1 });
      expect(pricing.listCall).toEqual([
        { id: 4, rowId: "4_0" },
        { id: 4, rowId: "4_1" },
      ]);
    });

    test("getMarketingList sorts the channels by name, ignoring case and missing names", async () => {
      respond({ getMarketingList: accepted([{ id: 1, name: "zeta" }, { id: 2 }, { id: 3, name: "Alfa" }]) });
      const pricing = usePricingStore();

      await pricing.getMarketingList();

      expect(sentConfig("getMarketingList")!.data).toEqual({ id_branch: 1 });
      expect(pricing.listMarketing.map((v) => v.id)).toEqual([2, 3, 1]);
    });

    test("getModulesEntities, getCargarEjecutivo, getPersonalPricing and cargarTrabajadores fill the executives for pricing and aduana", async () => {
      const ejecutivos = [{ id_entitie: 4, name: "ANA" }];
      respond({
        getModulesEntities: accepted([...ejecutivos]),
        cargar_ejecutivo: accepted([...ejecutivos]),
        get_personal_pricing: accepted([...ejecutivos]),
        cargar_trabajadores: accepted(ejecutivos),
      });
      const pricing = usePricingStore();
      const aduana = useAduanaStore();
      const sharedAfter = async (load: () => Promise<void>) => {
        await load();
        return toRaw(aduana.listEjecutivo) === toRaw(pricing.listEjecutivo);
      };

      const shared = [
        await sharedAfter(() => pricing.getModulesEntities()),
        await sharedAfter(() => pricing.getCargarEjecutivo()),
        await sharedAfter(() => pricing.getPersonalPricing()),
        await sharedAfter(() => pricing.cargarTrabajadores({ id_branch: 1, rol: "V" })),
      ];

      expect(sentConfig("getModulesEntities")!.data).toEqual({ id_branch: 1, id_module: 6 });
      expect(sentConfig("cargar_ejecutivo")!.params).toEqual({ id_branch: 1, id_module: 6 });
      expect(sentConfig("get_personal_pricing")!.url).toBe(URL_MAIN + "get_personal_pricing?id_branch=1");
      expect(sentConfig("cargar_trabajadores")!.params).toEqual({ id_branch: 1, rol: "V" });
      expect(pricing.listEjecutivo).toEqual(ejecutivos);
      expect(shared).toEqual([true, true, true, true]);
    });

    test.each([
      ["getModality", "getModality", "listModality"],
      ["getShipment", "getShipment", "listShipment"],
      ["getIncoterms", "getIncoterms", "listIncoterms"],
    ] as const)("%s posts the branch and fills the list for pricing and aduana", async (action, path, list) => {
      respond({ [path]: accepted([{ id: 1, name: "X" }]) });
      const pricing = usePricingStore();

      await pricing[action]();

      expect(sentConfig(path)).toEqual({ method: "post", url: URL_MAIN + path, headers: JSON_HEADERS, data: { id_branch: 1 } });
      expect(pricing[list]).toEqual([{ id: 1, name: "X" }]);
      expect(toRaw(useAduanaStore()[list])).toBe(toRaw(pricing[list]));
    });

    test("getPortBegin and getPortEnd send the default search and fill both lists", async () => {
      respond({ getPortBegin: accepted([{ id_port: 1 }]), getPortEnd: accepted([{ id_port: 2 }]) });
      const pricing = usePricingStore();

      await pricing.getPortBegin({ search: "cal" });
      await pricing.getPortEnd({ id_transport: 1, id: 2 });

      expect(sentConfig("getPortBegin")!.data).toEqual({ id_branch: 1, id_transport: 0, id: null, search: "cal", limit: 20 });
      expect(sentConfig("getPortEnd")!.data).toEqual({ id_branch: 1, id_transport: 1, id: 2, search: null, limit: 20 });
      expect(pricing.listPortBegin).toEqual([{ id_port: 1 }]);
      expect(pricing.listPortEnd).toEqual([{ id_port: 2 }]);
      expect(toRaw(useAduanaStore().listPortBegin)).toBe(toRaw(pricing.listPortBegin));
      expect(toRaw(useAduanaStore().listPortEnd)).toBe(toRaw(pricing.listPortEnd));
    });

    test("getTipoCostos sends the shipment id of a selected shipment row and fills pricing, configEmpresa and aduana", async () => {
      respond({ tipo_costo_x_embarque: accepted([{ codigo: "FL", name: "FLETE" }]) });
      const pricing = usePricingStore();
      pricing.datosPrincipales = { idtipocarga: { id: 3 }, idsentido: 1 };

      await pricing.getTipoCostos();

      expect(sentConfig("tipo_costo_x_embarque")!.url).toBe(URL_MAIN + "tipo_costo_x_embarque?id_shipment=3&id_modality=1");
      expect(pricing.listTipoCostos).toEqual([{ codigo: "FL", name: "FLETE" }]);
      expect(pricing.namesection).toEqual([{ codigo: "FL", name: "FLETE" }]);
      expect(useConfigEmpresaStore().listTipoCostos).toEqual([{ codigo: "FL", name: "FLETE" }]);
      expect(toRaw(useAduanaStore().listTipoCostos)).toBe(toRaw(pricing.listTipoCostos));
      expect(toRaw(useAduanaStore().namesection)).toBe(toRaw(pricing.listTipoCostos));
    });

    test("getTipoCostos empties the cost types and shows the message on a rejection", async () => {
      respond({ tipo_costo_x_embarque: rejected("Sin tipos") });
      const pricing = usePricingStore();
      pricing.datosPrincipales = { idtipocarga: 2, idsentido: 1 };

      await pricing.getTipoCostos();

      expect(sentConfig("tipo_costo_x_embarque")!.url).toBe(URL_MAIN + "tipo_costo_x_embarque?id_shipment=2&id_modality=1");
      expect(pricing.listTipoCostos).toEqual([]);
      expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "Sin tipos" });
    });

    test("getMultiplicador sends the shipment and containers and adds value, text and a zero valor", async () => {
      respond({ getMultiplicador: accepted([{ id: 3, name: "W/M", valor: "1.5" }, { id: 4, name: "Bulto", valor: null }]) });
      const pricing = usePricingStore();
      pricing.datosPrincipales = { idtipocarga: 3, containers: [{ id_containers: 5, cantidad: 2 }] };

      await pricing.getMultiplicador();

      expect(sentConfig("getMultiplicador")!.data).toEqual({ id_shipment: 3, containers: [{ id_containers: 5, cantidad: 2 }], id_branch: 1 });
      const expected = [
        { id: 3, name: "W/M", valor: "1.5", value: 3, text: "W/M" },
        { id: 4, name: "Bulto", valor: 0, value: 4, text: "Bulto" },
      ];
      expect(pricing.listMultiplicador).toEqual(expected);
      expect(useConfigEmpresaStore().lstMultiplicador).toEqual(expected);
      expect(toRaw(useAduanaStore().listMultiplicador)).toBe(toRaw(pricing.listMultiplicador));
    });

    test("getModuleRole posts a JSON string and maps the roles", async () => {
      respond({ getModuleRole: accepted([{ id: 8, id_role: 2, name: "NAVIERA" }]) });
      const pricing = usePricingStore();

      await pricing.getModuleRole();

      expect(sentConfig("getModuleRole")!.data).toBe(JSON.stringify({ id_module: 6, id_branch: 1 }));
      expect(pricing.listRoles).toEqual([{ id: 8, value: 2, text: "NAVIERA", id_role: 2 }]);
    });

    test("getItemsServices sends the quote combination, keeps a copy of the services and runs aduana's action too", async () => {
      respond({ getItemsServices: accepted([{ id_groupservices: 4, status: 1 }]) });
      const pricing = usePricingStore();
      pricing.datosPrincipales = { idincoterms: 9, idsentido: 1, idtipocarga: { id: 3 } };
      const aduana = useAduanaStore();
      const aduanaItems = vi.spyOn(aduana, "getItemsServices");

      await pricing.getItemsServices();

      expect(sentConfig("getItemsServices")!.data).toEqual({ id_branch: 1, id_incoterms: 9, id_modality: 1, id_shipment: 3 });
      expect(pricing.listServices).toEqual([{ id_groupservices: 4, status: 1 }]);
      expect(pricing.copylistServices).toEqual([{ id_groupservices: 4, status: 1 }]);
      for (const list of [aduana.listServices, aduana.copylistServices, pricing.copylistServices]) expect(toRaw(list)).toBe(toRaw(pricing.listServices));
      expect(aduanaItems).toHaveBeenCalledTimes(1);
      expect(httpMock.mock.invocationCallOrder[0]).toBeLessThan(aduanaItems.mock.invocationCallOrder[0]!);
    });

    test("getItemsServices still runs aduana's action and rejects when the quote has no shipment", async () => {
      respond({ getItemsServices: accepted([]) });
      const pricing = usePricingStore();
      pricing.datosPrincipales = { idincoterms: 9, idsentido: 1 };
      const aduanaItems = vi.spyOn(useAduanaStore(), "getItemsServices");

      await expect(pricing.getItemsServices()).rejects.toThrow(TypeError);

      expect(aduanaItems).toHaveBeenCalledTimes(1);
      expect(httpMock.mock.calls.map(([config]) => config.data)).toEqual([{ id_branch: 1, id_incoterms: "", id_modality: "", id_shipment: "" }]);
    });

    test("getItemsServicesDetails sends the active services and builds one option row and one sale row per cost", async () => {
      const valores = [
        { id: 1, id_groupservices: 4, nameservice: "FLETE", price: "45.5", id_multiplicador: 3, esfleteflag: true, id_proveedor: 40, code_cost: 1, categoria_role: "NA" },
        { id: 2, id_groupservices: 7, nameservice: "SIN FLAGS", price: null, id_multiplicador: null, code_cost: 2 },
      ];
      respond({ getItemsServicesDetails: accepted(valores) });
      const pricing = usePricingStore();
      pricing.datosPrincipales = { idincoterms: 9, idsentido: 1, idtipocarga: 3, containers: [] };
      pricing.listServices = [
        { id_groupservices: 4, status: true },
        { id_groupservices: 7, status: 0 },
      ];

      await pricing.getItemsServicesDetails();

      expect(sentConfig("getItemsServicesDetails")!.data).toEqual({
        id_branch: 1,
        id_incoterms: 9,
        id_modality: 1,
        id_shipment: 3,
        services: [{ id_groupservices: 4, status: true }],
        containers: [],
      });
      expect(pricing.listCostos).toMatchInlineSnapshot(`
        [
          {
            "cif": 0.35,
            "code_cost": 1,
            "costosflag": 0,
            "costounitario": "45.5",
            "esaduanaflag": 0,
            "esalmacenflag": 0,
            "esfleteflag": 1,
            "esgastostercerosflag": 0,
            "eslocalflag": 0,
            "esopcionflag": 1,
            "esorigenflag": 0,
            "esventaflag": 0,
            "id": 1,
            "id_begend": undefined,
            "id_groupservices": 4,
            "id_incoterms": undefined,
            "id_modality": undefined,
            "id_multiplicador": 3,
            "id_proveedor": 40,
            "id_role": undefined,
            "id_services": undefined,
            "id_shipment": undefined,
            "namebegend": undefined,
            "namegroupservice": undefined,
            "namemultiplicador": undefined,
            "namerole": undefined,
            "nameservice": "FLETE",
            "seguro": 0.45,
            "servicioFlag": 1,
            "statedelete": 0,
            "status": 1,
          },
          {
            "categoria_role": "NA",
            "cif": 0.35,
            "code_cost": 1,
            "costosflag": 0,
            "costounitario": 0,
            "esaduanaflag": 0,
            "esalmacenflag": 0,
            "esfleteflag": 1,
            "esgastostercerosflag": 0,
            "eslocalflag": 0,
            "esopcionflag": 0,
            "esorigenflag": 0,
            "esventaflag": 1,
            "id": 1,
            "id_begend": undefined,
            "id_groupservices": 4,
            "id_incoterms": undefined,
            "id_modality": undefined,
            "id_multiplicador": 3,
            "id_proveedor": 40,
            "id_role": undefined,
            "id_services": undefined,
            "id_shipment": undefined,
            "namebegend": undefined,
            "namegroupservice": undefined,
            "namemultiplicador": undefined,
            "namerole": undefined,
            "nameservice": "FLETE",
            "seguro": 0.45,
            "servicioFlag": 1,
            "statedelete": 0,
            "status": 1,
          },
        ]
      `);
      expect(toRaw(useAduanaStore().listCostos)).toBe(toRaw(pricing.listCostos));
    });

    test("getItemsServicesDetails warns when the combination has no costs and empties the list", async () => {
      respond({ getItemsServicesDetails: accepted(null) });
      const pricing = usePricingStore();
      pricing.datosPrincipales = { idincoterms: 9, idsentido: 1, idtipocarga: 3, containers: [] };

      await pricing.getItemsServicesDetails();

      expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "warning", title: "ADVERTENCIA" });
      expect(pricing.listCostos).toEqual([]);
    });
  });

  describe("quote", () => {
    test("registrarQuote posts the LCL quote with formatted costs, notes, taxes and services and keeps the new id", async () => {
      httpMock.mockResolvedValue({ data: { insertId: 501, nro_quote: "15000-P", msg: "Registrado" } });
      const pricing = cotizacion();
      pricing.totalFlete = 125;

      await pricing.registrarQuote({ fullflag: false });

      expect(sentConfig("setQuote")).toMatchInlineSnapshot(`
        {
          "data": {
            "amount": 5000,
            "containers": [],
            "contenedores": [],
            "descripcionMercancia": "REPUESTOS",
            "descripcioncarga": "REPUESTOS",
            "esgrupalflag": false,
            "esindividualflag": true,
            "fullflag": false,
            "id": 77,
            "id_branch": 1,
            "id_percepcionaduana": 53,
            "id_pricing": 4,
            "id_status": 454,
            "iddestino": 346,
            "idincoterms": 9,
            "idorigen": 207,
            "idsentido": 1,
            "idtipocarga": 3,
            "nombre": "ZEVALLOS ALFONSO",
            "numerobultos": 3,
            "opcionCostos": [
              {
                "date_end": "2026-12-31",
                "listCostos": [
                  {
                    "code_cost": 1,
                    "code_service": "",
                    "concepto": "FLETE INTERNACIONAL",
                    "costounitario": 50,
                    "esfleteflag": 1,
                    "esopcionflag": 0,
                    "esventaflag": 1,
                    "id": 11,
                    "id_groupservices": 4,
                    "id_multiplicador": 3,
                    "minimo": 0,
                    "nameservice": "FLETE INTERNACIONAL",
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "code_cost": 2,
                    "code_service": "",
                    "concepto": "GASTOS EN ORIGEN",
                    "costounitario": 120.5,
                    "esopcionflag": 0,
                    "esorigenflag": 1,
                    "esventaflag": 1,
                    "id": 12,
                    "id_groupservices": 4,
                    "id_multiplicador": 1,
                    "minimo": 0,
                    "nameservice": "GASTOS EN ORIGEN",
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "code_cost": 3,
                    "code_service": "",
                    "concepto": "VISTOS BUENOS",
                    "considerarvalorminimoflag": true,
                    "costounitario": "35",
                    "eslocalflag": 1,
                    "esopcionflag": 0,
                    "esventaflag": 1,
                    "id": 13,
                    "id_groupservices": 7,
                    "id_multiplicador": 2,
                    "minimo": 100,
                    "nameservice": "VISTOS BUENOS",
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "cif": 0.35,
                    "code_cost": 6,
                    "code_service": "",
                    "concepto": "COMISION AGENCIA",
                    "costounitario": 1,
                    "esaduanaflag": 1,
                    "esopcionflag": 0,
                    "esventaflag": 1,
                    "id": 14,
                    "id_groupservices": 7,
                    "id_multiplicador": 13,
                    "minimo": 118,
                    "nameservice": "COMISION AGENCIA",
                    "seguro": 0.45,
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "code_cost": 4,
                    "code_service": "",
                    "concepto": "ALMACEN",
                    "costounitario": 80,
                    "esalmacenflag": 1,
                    "esopcionflag": 0,
                    "esventaflag": 1,
                    "id": 15,
                    "id_groupservices": 9,
                    "id_multiplicador": 4,
                    "minimo": 0,
                    "nameservice": "ALMACEN",
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "cif": 0.35,
                    "code_cost": 15,
                    "code_service": "",
                    "concepto": "SEGURO DE CARGA",
                    "costounitario": 1,
                    "esgastostercerosflag": 1,
                    "esopcionflag": 0,
                    "esventaflag": 1,
                    "id": 16,
                    "id_groupservices": 9,
                    "id_multiplicador": 5,
                    "minimo": 0,
                    "nameservice": "SEGURO DE CARGA",
                    "seguro": 0.45,
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "code_cost": 1,
                    "code_service": "",
                    "concepto": "FLETE INTERNACIONAL",
                    "costounitario": 40,
                    "esfleteflag": 1,
                    "esopcionflag": 1,
                    "esventaflag": 0,
                    "id": 21,
                    "id_groupservices": 4,
                    "id_multiplicador": 3,
                    "id_proveedor": 40,
                    "minimo": 0,
                    "nameservice": "FLETE INTERNACIONAL",
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "code_cost": 3,
                    "code_service": "",
                    "concepto": "VISTOS BUENOS",
                    "costounitario": 30,
                    "eslocalflag": 1,
                    "esopcionflag": 1,
                    "esventaflag": 0,
                    "id": 22,
                    "id_groupservices": 7,
                    "id_multiplicador": 1,
                    "id_proveedor": 41,
                    "minimo": 0,
                    "nameservice": "VISTOS BUENOS",
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "code_cost": 6,
                    "code_service": "",
                    "concepto": "COMISION AGENCIA",
                    "costounitario": 0,
                    "esaduanaflag": 1,
                    "esopcionflag": 1,
                    "esventaflag": 0,
                    "id": 23,
                    "id_groupservices": 7,
                    "id_multiplicador": 1,
                    "id_proveedor": 41,
                    "minimo": 0,
                    "nameservice": "COMISION AGENCIA",
                    "status": 1,
                    "subtotal": 0,
                  },
                ],
                "listImpuestos": [
                  {
                    "id": 1,
                    "name": "FOB",
                    "nro_propuesta": undefined,
                    "orden": 1,
                    "percentage": 0,
                    "type": 1,
                    "valor": "5000.00",
                  },
                  {
                    "id": 2,
                    "name": "FLETE",
                    "nro_propuesta": undefined,
                    "orden": 2,
                    "percentage": 0,
                    "type": 2,
                    "valor": "125.00",
                  },
                  {
                    "id": 3,
                    "name": "SEGURO",
                    "nro_propuesta": undefined,
                    "orden": 3,
                    "percentage": 1.5,
                    "type": 3,
                    "valor": "76.88",
                  },
                  {
                    "id": 5,
                    "name": "AD VALOREM",
                    "nro_propuesta": undefined,
                    "orden": 5,
                    "percentage": 6,
                    "type": 5,
                    "valor": "312.11",
                  },
                  {
                    "id": 7,
                    "name": "IPM",
                    "nro_propuesta": undefined,
                    "orden": 7,
                    "percentage": 2,
                    "type": 7,
                    "valor": "110.28",
                  },
                  {
                    "id": 8,
                    "name": "IGV",
                    "nro_propuesta": undefined,
                    "orden": 8,
                    "percentage": 16,
                    "type": 8,
                    "valor": "882.24",
                  },
                ],
                "listNotasQuote": [
                  {
                    "descripcion": "SALIDAS SEMANALES",
                    "esincluyeflag": 1,
                    "esnoincluyeflag": 0,
                    "esprincipalflag": 1,
                    "id": 1,
                    "nro_propuesta": undefined,
                    "status": 1,
                  },
                  {
                    "descripcion": "NO INCLUYE SEGURO",
                    "esincluyeflag": 0,
                    "esnoincluyeflag": 1,
                    "esprincipalflag": 1,
                    "id": 2,
                    "nro_propuesta": undefined,
                    "status": 1,
                  },
                ],
                "nro_propuesta": 1,
                "selected": true,
                "tiempo_transito": 30,
              },
            ],
            "peso": 1200,
            "serviciocotizacion": [
              {
                "codegroupservices": 1,
                "id": 1,
                "idBegEnd": 1,
                "nameservice": "FLETE",
                "status": 1,
              },
              {
                "codegroupservices": 3,
                "id": 2,
                "idBegEnd": 2,
                "nameservice": "LOCALES",
                "status": true,
              },
              {
                "codegroupservices": 7,
                "id": 3,
                "idBegEnd": 3,
                "nameservice": "ADUANA",
                "status": 0,
              },
              {
                "codegroupservices": 9,
                "id": 4,
                "idBegEnd": 4,
                "nameservice": "ALMACEN",
                "status": 1,
              },
              {
                "codegroupservices": 15,
                "id": 5,
                "idBegEnd": 3,
                "nameservice": "IMPUESTOS",
                "status": 1,
              },
            ],
            "telefono": "+51997300697",
            "tiporeporte": "TOTAL",
            "url_folderonedrive": "https://drive/x",
            "ventascasillerodetalles": [],
            "volumen": 2.5,
          },
          "headers": {
            "Content-Type": "application/json",
          },
          "method": "post",
          "url": "undefinedsetQuote",
        }
      `);
      expect([pricing.id, pricing.nro_quote, pricing.mensaje, pricing.tiporeporte]).toEqual([501, "15000-P", "Registrado", ""]);
    });

    test("registrarQuote sends the containers and no weights for an FCL quote", async () => {
      httpMock.mockResolvedValue({ data: { insertId: 502, nro_quote: "15001-P", msg: "ok" } });
      const pricing = cotizacion();
      pricing.datosPrincipales = { ...clone(DATOS), idtipocarga: { id: 2 }, containers: [{ id: 7, id_containers: 5, cantidad: 2 }] };
      pricing.tiporeporte = "DETALLE";

      await pricing.registrarQuote({});

      const data = sentConfig("setQuote")!.data as Record<string, unknown>;
      expect(data).toMatchObject({ idtipocarga: 2, numerobultos: 0, peso: 0, volumen: 0, fullflag: true, tiporeporte: "DETALLE" });
      expect(data.contenedores).toEqual([{ id: 7, id_contenedor: 5, cantidad: 2, status: true }]);
    });

    test("registrarQuote computes the cost subtotals only for multiplier rows that carry a length", async () => {
      httpMock.mockResolvedValue({ data: { insertId: 503, nro_quote: "15002-P", msg: "ok" } });
      const pricing = cotizacion();
      pricing.listMultiplicador = MULTIPLICADORES.map((m) => ({ ...m, length: 1 }));
      pricing.datosPrincipales = { ...clone(DATOS), metroscc: 2.5, kg: 1200 };
      pricing.totalFlete = 125;

      await pricing.registrarQuote({ fullflag: false });

      const [option] = (sentConfig("setQuote")!.data as { opcionCostos: { listCostos: Costo[] }[] }).opcionCostos;
      expect(option!.listCostos.map((c) => [c.concepto, c.id_multiplicador, c.subtotal])).toMatchSnapshot();
    });

    test("registrarQuotePorCambioIncoterms posts the services and options it receives with the quote header", async () => {
      httpMock.mockResolvedValue({ data: { insertId: 503, nro_quote: "15002-P", msg: "ok" } });
      const pricing = cotizacion();
      pricing.datosPrincipales.id_marketing = 150;
      pricing.datosPrincipales.id_vendedor = 9;

      await pricing.registrarQuotePorCambioIncoterms({ listServices: SERVICIOS.slice(0, 2), opcionCostos: [opcion({ nro_propuesta: 2, selected: false })] });

      expect(sentConfig("setQuote")).toMatchInlineSnapshot(`
        {
          "data": {
            "contenedores": [],
            "descripcionMercancia": "REPUESTOS",
            "direccionproveedor": undefined,
            "esgrupalflag": false,
            "esindividualflag": true,
            "fullflag": true,
            "idPricing": 4,
            "idVendedor": 9,
            "id_branch": 1,
            "id_entitie": undefined,
            "id_marketing": 150,
            "id_percepcionaduana": 53,
            "id_proveedor": undefined,
            "iddestino": 346,
            "iddistrito": undefined,
            "idincoterms": 9,
            "idorigen": 207,
            "idprovincia": undefined,
            "idsentido": 1,
            "idtipocarga": 3,
            "monto": 5000,
            "numerobultos": 3,
            "opcionCostos": [
              {
                "date_end": "2026-12-31",
                "listCostos": [
                  {
                    "code_cost": 1,
                    "code_service": "",
                    "concepto": "FLETE INTERNACIONAL",
                    "costounitario": 50,
                    "esfleteflag": 1,
                    "esopcionflag": 0,
                    "esventaflag": 1,
                    "id": 11,
                    "id_groupservices": 4,
                    "id_multiplicador": 3,
                    "minimo": 0,
                    "nameservice": "FLETE INTERNACIONAL",
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "code_cost": 2,
                    "code_service": "",
                    "concepto": "GASTOS EN ORIGEN",
                    "costounitario": 120.5,
                    "esopcionflag": 0,
                    "esorigenflag": 1,
                    "esventaflag": 1,
                    "id": 12,
                    "id_groupservices": 4,
                    "id_multiplicador": 1,
                    "minimo": 0,
                    "nameservice": "GASTOS EN ORIGEN",
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "code_cost": 3,
                    "code_service": "",
                    "concepto": "VISTOS BUENOS",
                    "considerarvalorminimoflag": true,
                    "costounitario": "35",
                    "eslocalflag": 1,
                    "esopcionflag": 0,
                    "esventaflag": 1,
                    "id": 13,
                    "id_groupservices": 7,
                    "id_multiplicador": 2,
                    "minimo": 100,
                    "nameservice": "VISTOS BUENOS",
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "cif": 0.35,
                    "code_cost": 6,
                    "code_service": "",
                    "concepto": "COMISION AGENCIA",
                    "costounitario": 1,
                    "esaduanaflag": 1,
                    "esopcionflag": 0,
                    "esventaflag": 1,
                    "id": 14,
                    "id_groupservices": 7,
                    "id_multiplicador": 13,
                    "minimo": 118,
                    "nameservice": "COMISION AGENCIA",
                    "seguro": 0.45,
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "code_cost": 4,
                    "code_service": "",
                    "concepto": "ALMACEN",
                    "costounitario": 80,
                    "esalmacenflag": 1,
                    "esopcionflag": 0,
                    "esventaflag": 1,
                    "id": 15,
                    "id_groupservices": 9,
                    "id_multiplicador": 4,
                    "minimo": 0,
                    "nameservice": "ALMACEN",
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "cif": 0.35,
                    "code_cost": 15,
                    "code_service": "",
                    "concepto": "SEGURO DE CARGA",
                    "costounitario": 1,
                    "esgastostercerosflag": 1,
                    "esopcionflag": 0,
                    "esventaflag": 1,
                    "id": 16,
                    "id_groupservices": 9,
                    "id_multiplicador": 5,
                    "minimo": 0,
                    "nameservice": "SEGURO DE CARGA",
                    "seguro": 0.45,
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "code_cost": 1,
                    "code_service": "",
                    "concepto": "FLETE INTERNACIONAL",
                    "costounitario": 40,
                    "esfleteflag": 1,
                    "esopcionflag": 1,
                    "esventaflag": 0,
                    "id": 21,
                    "id_groupservices": 4,
                    "id_multiplicador": 3,
                    "id_proveedor": 40,
                    "minimo": 0,
                    "nameservice": "FLETE INTERNACIONAL",
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "code_cost": 3,
                    "code_service": "",
                    "concepto": "VISTOS BUENOS",
                    "costounitario": 30,
                    "eslocalflag": 1,
                    "esopcionflag": 1,
                    "esventaflag": 0,
                    "id": 22,
                    "id_groupservices": 7,
                    "id_multiplicador": 1,
                    "id_proveedor": 41,
                    "minimo": 0,
                    "nameservice": "VISTOS BUENOS",
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "code_cost": 6,
                    "code_service": "",
                    "concepto": "COMISION AGENCIA",
                    "costounitario": 0,
                    "esaduanaflag": 1,
                    "esopcionflag": 1,
                    "esventaflag": 0,
                    "id": 23,
                    "id_groupservices": 7,
                    "id_multiplicador": 1,
                    "id_proveedor": 41,
                    "minimo": 0,
                    "nameservice": "COMISION AGENCIA",
                    "status": 1,
                    "subtotal": 0,
                  },
                ],
                "listImpuestos": [],
                "listNotasQuote": [
                  {
                    "descripcion": "SALIDAS SEMANALES",
                    "esincluyeflag": 1,
                    "esnoincluyeflag": 0,
                    "esprincipalflag": 1,
                    "id": 1,
                    "nro_propuesta": undefined,
                    "status": 1,
                  },
                  {
                    "descripcion": "NO INCLUYE SEGURO",
                    "esincluyeflag": 0,
                    "esnoincluyeflag": 1,
                    "esprincipalflag": 1,
                    "id": 2,
                    "nro_propuesta": undefined,
                    "status": 1,
                  },
                ],
                "nro_propuesta": 2,
                "selected": false,
                "tiempo_transito": 30,
              },
            ],
            "peso": 1200,
            "proveedor": undefined,
            "serviciocotizacion": [
              {
                "codegroupservices": 1,
                "id": 1,
                "idBegEnd": 1,
                "nameservice": "FLETE",
                "status": 1,
              },
              {
                "codegroupservices": 3,
                "id": 2,
                "idBegEnd": 2,
                "nameservice": "LOCALES",
                "status": true,
              },
            ],
            "statusquote": 454,
            "telefonoproveedor": undefined,
            "tiporeporte": "TOTAL",
            "ventascasillerodetalles": [],
            "volumen": 2.5,
          },
          "headers": {
            "Content-Type": "application/json",
          },
          "method": "post",
          "url": "undefinedsetQuote",
        }
      `);
      expect(pricing.id).toBe(503);
    });

    test("updateQuote puts the edited quote with the edit formatter and shows the answer", async () => {
      httpMock.mockResolvedValue({ data: accepted([]) });
      const pricing = cotizacion();
      pricing.id = 77;
      pricing.opcionCostos = [opcion({ id: 900 })];

      await pricing.updateQuote();

      expect(sentConfig("putQuote")).toMatchInlineSnapshot(`
        {
          "data": {
            "amount": 5000,
            "containers": [],
            "contenedores": [],
            "descripcionMercancia": "REPUESTOS",
            "descripcioncarga": "REPUESTOS",
            "esgrupalflag": false,
            "esindividualflag": true,
            "fullflag": true,
            "id": 77,
            "id_percepcionaduana": 53,
            "id_pricing": 4,
            "id_quote": 77,
            "id_status": 454,
            "iddestino": 346,
            "idincoterms": 9,
            "idorigen": 207,
            "idsentido": 1,
            "idtipocarga": 3,
            "nombre": "ZEVALLOS ALFONSO",
            "numerobultos": 3,
            "opcionCostos": [
              {
                "date_end": "2026-12-31",
                "id": 900,
                "listCostos": [
                  {
                    "code_cost": 1,
                    "concepto": "FLETE INTERNACIONAL",
                    "costounitario": 50,
                    "esfleteflag": 1,
                    "esopcionflag": 0,
                    "esventaflag": 1,
                    "id": 11,
                    "id_groupservices": 4,
                    "id_multiplicador": 3,
                    "minimo": 0,
                    "nameservice": "FLETE INTERNACIONAL",
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "code_cost": 2,
                    "concepto": "GASTOS EN ORIGEN",
                    "costounitario": 120.5,
                    "esopcionflag": 0,
                    "esorigenflag": 1,
                    "esventaflag": 1,
                    "id": 12,
                    "id_groupservices": 4,
                    "id_multiplicador": 1,
                    "minimo": 0,
                    "nameservice": "GASTOS EN ORIGEN",
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "code_cost": 3,
                    "concepto": "VISTOS BUENOS",
                    "considerarvalorminimoflag": true,
                    "costounitario": "35",
                    "eslocalflag": 1,
                    "esopcionflag": 0,
                    "esventaflag": 1,
                    "id": 13,
                    "id_groupservices": 7,
                    "id_multiplicador": 2,
                    "minimo": 100,
                    "nameservice": "VISTOS BUENOS",
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "cif": 0.35,
                    "code_cost": 6,
                    "concepto": "COMISION AGENCIA",
                    "costounitario": 1,
                    "esaduanaflag": 1,
                    "esopcionflag": 0,
                    "esventaflag": 1,
                    "id": 14,
                    "id_groupservices": 7,
                    "id_multiplicador": 13,
                    "minimo": 118,
                    "nameservice": "COMISION AGENCIA",
                    "seguro": 0.45,
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "code_cost": 4,
                    "concepto": "ALMACEN",
                    "costounitario": 80,
                    "esalmacenflag": 1,
                    "esopcionflag": 0,
                    "esventaflag": 1,
                    "id": 15,
                    "id_groupservices": 9,
                    "id_multiplicador": 4,
                    "minimo": 0,
                    "nameservice": "ALMACEN",
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "cif": 0.35,
                    "code_cost": 15,
                    "concepto": "SEGURO DE CARGA",
                    "costounitario": 1,
                    "esgastostercerosflag": 1,
                    "esopcionflag": 0,
                    "esventaflag": 1,
                    "id": 16,
                    "id_groupservices": 9,
                    "id_multiplicador": 5,
                    "minimo": 0,
                    "nameservice": "SEGURO DE CARGA",
                    "seguro": 0.45,
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "code_cost": 1,
                    "concepto": "FLETE INTERNACIONAL",
                    "costounitario": 40,
                    "esfleteflag": 1,
                    "esopcionflag": 1,
                    "esventaflag": 0,
                    "id": 21,
                    "id_groupservices": 4,
                    "id_multiplicador": 3,
                    "id_proveedor": 40,
                    "minimo": 0,
                    "nameservice": "FLETE INTERNACIONAL",
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "code_cost": 3,
                    "concepto": "VISTOS BUENOS",
                    "costounitario": 30,
                    "eslocalflag": 1,
                    "esopcionflag": 1,
                    "esventaflag": 0,
                    "id": 22,
                    "id_groupservices": 7,
                    "id_multiplicador": 1,
                    "id_proveedor": 41,
                    "minimo": 0,
                    "nameservice": "VISTOS BUENOS",
                    "status": 1,
                    "subtotal": 0,
                  },
                  {
                    "code_cost": 6,
                    "concepto": "COMISION AGENCIA",
                    "costounitario": 0,
                    "esaduanaflag": 1,
                    "esopcionflag": 1,
                    "esventaflag": 0,
                    "id": 23,
                    "id_groupservices": 7,
                    "id_multiplicador": 1,
                    "id_proveedor": 41,
                    "minimo": 0,
                    "nameservice": "COMISION AGENCIA",
                    "status": 1,
                    "subtotal": 0,
                  },
                ],
                "listImpuestos": [
                  {
                    "id": 1,
                    "name": "FOB",
                    "nro_propuesta": undefined,
                    "orden": 1,
                    "percentage": 0,
                    "type": 1,
                    "valor": "5000.00",
                  },
                  {
                    "id": 2,
                    "name": "FLETE",
                    "nro_propuesta": undefined,
                    "orden": 2,
                    "percentage": 0,
                    "type": 2,
                    "valor": "0.00",
                  },
                  {
                    "id": 3,
                    "name": "SEGURO",
                    "nro_propuesta": undefined,
                    "orden": 3,
                    "percentage": 1.5,
                    "type": 3,
                    "valor": "75.00",
                  },
                  {
                    "id": 5,
                    "name": "AD VALOREM",
                    "nro_propuesta": undefined,
                    "orden": 5,
                    "percentage": 6,
                    "type": 5,
                    "valor": "304.50",
                  },
                  {
                    "id": 7,
                    "name": "IPM",
                    "nro_propuesta": undefined,
                    "orden": 7,
                    "percentage": 2,
                    "type": 7,
                    "valor": "107.59",
                  },
                  {
                    "id": 8,
                    "name": "IGV",
                    "nro_propuesta": undefined,
                    "orden": 8,
                    "percentage": 16,
                    "type": 8,
                    "valor": "860.72",
                  },
                ],
                "listNotasQuote": [
                  {
                    "descripcion": "SALIDAS SEMANALES",
                    "esincluyeflag": 1,
                    "esnoincluyeflag": 0,
                    "esprincipalflag": 1,
                    "id": 1,
                    "nro_propuesta": undefined,
                    "status": 1,
                  },
                  {
                    "descripcion": "NO INCLUYE SEGURO",
                    "esincluyeflag": 0,
                    "esnoincluyeflag": 1,
                    "esprincipalflag": 1,
                    "id": 2,
                    "nro_propuesta": undefined,
                    "status": 1,
                  },
                ],
                "nro_propuesta": 1,
                "selected": true,
                "tiempo_transito": 30,
              },
            ],
            "peso": 1200,
            "serviciocotizacion": [
              {
                "codegroupservices": 1,
                "id": 1,
                "idBegEnd": 1,
                "nameservice": "FLETE",
                "status": 1,
              },
              {
                "codegroupservices": 3,
                "id": 2,
                "idBegEnd": 2,
                "nameservice": "LOCALES",
                "status": true,
              },
              {
                "codegroupservices": 7,
                "id": 3,
                "idBegEnd": 3,
                "nameservice": "ADUANA",
                "status": 0,
              },
              {
                "codegroupservices": 9,
                "id": 4,
                "idBegEnd": 4,
                "nameservice": "ALMACEN",
                "status": 1,
              },
              {
                "codegroupservices": 15,
                "id": 5,
                "idBegEnd": 3,
                "nameservice": "IMPUESTOS",
                "status": 1,
              },
            ],
            "telefono": "+51997300697",
            "tiporeporte": "TOTAL",
            "url_folderonedrive": "https://drive/x",
            "volumen": 2.5,
          },
          "headers": {
            "Content-Type": "application/json",
          },
          "method": "put",
          "url": "undefinedputQuote",
        }
      `);
      expect(Swal.fire).toHaveBeenCalledWith({ icon: "info", text: "ok" });
    });

    test("copiarQuote posts the quote and its town and keeps the copy", async () => {
      respond({ copiar_cotizacion: accepted([{ insertid: 601, nro_quote: "16000-P", mensaje: "Copiado" }]) });
      const pricing = usePricingStore();
      pricing.datosPrincipales = { id: 77, id_town: 12 };
      pricing.tiporeporte = "TOTAL";

      await pricing.copiarQuote({});

      expect(sentConfig("copiar_cotizacion")!.data).toEqual({ id: 77, id_town: 12 });
      expect([pricing.id, pricing.nro_quote, pricing.mensaje, pricing.tiporeporte]).toEqual([601, "16000-P", "Copiado", ""]);
    });

    test("getQuote loads the quote into the form, its options and flags, then reads its files and WhatsApp texts", async () => {
      const quote = {
        id: 77,
        quote: "14779-P",
        id_master: null,
        nro_exp: null,
        namestatusquote: "PRELIMINAR",
        descripcionmercancia: "REPUESTOS",
        statusquote: 454,
        monto: 1000,
        statusmain: 1,
        aprobadoflag: false,
        fullflag: 1,
        tiporeporte: "TOTAL",
        idtipocarga: 3,
        url_folderonedrive: "https://drive/77",
        containers: [{ id_containers: 5 }, { id_containers: 6 }],
        cliente: [{ id: 4159, nombrecompleto: "ZEVALLOS ALFONSO" }],
        servicios: [{ id: 1, status: 1 }],
        opcioncostos: [{ id: 3, nro_propuesta: 1, date_end: "2026-10-26", tiempo_transito: 35, listcostos: [{ id: 1 }], listimpuestos: [], listnotasquote: [], selected: true }],
      };
      respond({ getQuoteId: accepted([quote]), listado_files: accepted([{ name: "a.pdf" }]), get_texto_whatsapp: accepted([{ texto_pdf: "pdf" }]) });
      const pricing = usePricingStore();

      await pricing.getQuote({ id: 77 });
      await flushPromises();

      expect(sentConfig("getQuoteId")!.url).toBe(URL_MAIN + "getQuoteId?id=77");
      expect(pricing.datosPrincipales).toMatchObject({ id: 77, nameStatusQuote: "PRELIMINAR", descripcioncarga: "REPUESTOS", id_status: 454, amount: 1000 });
      expect(pricing.opcionCostos).toEqual([
        { id: 3, nro_propuesta: 1, date_end: "2026-10-26", tiempo_transito: 35, listCostos: [{ id: 1 }], listImpuestos: [], listNotasQuote: [], selected: true },
      ]);
      expect([pricing.id, pricing.nro_quote, pricing.dataCliente, pricing.fullflag, pricing.mostrarBtnActualizarFlag]).toEqual([
        77,
        "14779-P",
        { id: 4159, nombrecompleto: "ZEVALLOS ALFONSO" },
        1,
        true,
      ]);
      expect(sentConfig("listado_files")!.params).toEqual({ folderUrl: "https://drive/77" });
      expect(sentConfig("get_texto_whatsapp")!.params).toEqual({ id_shipment: 3, id_quote: 77, id_containers: "5,6", id_branch: 1 });
      expect(pricing.listadoFilesDrive).toEqual([{ name: "a.pdf" }]);
      expect(pricing.textWhatsapp).toEqual([{ texto_pdf: "pdf" }]);
    });

    test("getQuote hides the update button for an approved quote and skips the files without a folder", async () => {
      const quote = { id: 78, aprobadoflag: true, statusmain: 1, containers: [], cliente: [{}], servicios: [], opcioncostos: [] };
      respond({ getQuoteId: accepted([quote]), get_texto_whatsapp: rejected() });
      const pricing = usePricingStore();
      pricing.textWhatsapp = [{ texto_pdf: "x" }];

      await pricing.getQuote({ id: 78 });
      await flushPromises();

      expect(pricing.mostrarBtnActualizarFlag).toBe(false);
      expect(sentConfig("listado_files")).toBeUndefined();
      expect(pricing.textWhatsapp).toEqual([]);
    });

    test("getCotzacionCalculadora turns the ids into numbers and loads options without notes", async () => {
      const quote = {
        id: 5,
        idorigen: "207",
        iddestino: "346",
        idsentido: "1",
        idtipocarga: "3",
        idincoterms: "9",
        id_percepcionaduana: "53",
        descripcionmercancia: "PIEZAS",
        monto: 900,
        servicios: [{ id: 1 }],
        opcioncostos: [{ id: 3, nro_propuesta: 1, date_end: "2026-11-01", tiempo_transito: 20, listcostos: [], listimpuestos: [], listnotasquote: [{ id: 1 }], selected: true }],
      };
      respond({ "calc/ver_cotizacion": accepted([quote]) });
      const pricing = usePricingStore();

      await pricing.getCotzacionCalculadora({ id: 5 });

      expect(sentConfig("calc/ver_cotizacion")!.params).toEqual({ id: 5 });
      expect(pricing.datosPrincipales).toMatchObject({ idorigen: 207, iddestino: 346, idsentido: 1, idtipocarga: 3, idincoterms: 9, descripcioncarga: "PIEZAS", amount: 900 });
      expect(pricing.opcionCostos).toEqual([{ nro_propuesta: 1, date_end: "2026-11-01", tiempo_transito: 20, listCostos: [], listImpuestos: [], selected: true }]);
    });

    test("resetQuoteNew and SET_RESET clear the quote form with the session user as seller and pricing", () => {
      const pricing = cotizacion();
      pricing.btnRegistrar = true;

      pricing.resetQuoteNew();

      expect(pricing.opcionCostos).toEqual([{ nro_propuesta: 1, date_end: "", tiempo_transito: 0, listCostos: [], listImpuestos: [], listNotasQuote: [], selected: false }]);
      expect(pricing.datosPrincipales).toMatchObject({ id_vendedor: 4, id_pricing: 4, idtipocarga: "", containers: [] });
      expect([pricing.listServices, pricing.btnRegistrar]).toEqual([[], false]);

      pricing.tab = 3;
      pricing.listQuotes = [{ id: 1 }];
      pricing.SET_RESET();

      expect([pricing.tab, pricing.listQuotes, pricing.datosPrincipales.esindividualflag, pricing.datosPrincipales.id_vendedor]).toEqual([1, [], true, 4]);
      expect(pricing.opcionCostos[0]!.tiempo_transito).toBe(35);
    });

    test("validarCosto flags the option costs at zero that belong to an active service and a non-percentage multiplier", async () => {
      const pricing = cotizacion();
      pricing.listCostos = [
        { id: 1, esopcionflag: 1, id_multiplicador: 3, id_groupservices: 4, costounitario: 0 },
        { id: 2, esopcionflag: 1, id_multiplicador: 5, id_groupservices: 4, costounitario: 0 },
        { id: 3, esopcionflag: 1, id_multiplicador: 3, id_groupservices: 4, costounitario: 10 },
      ];

      expect(await pricing.validarCosto()).toBe(false);
      expect(pricing.listCostos.map((v) => v.error)).toEqual(["El costo que tiene un valor 0.00.", "", ""]);
    });

    test("getNombreCotizacion builds the LCL name from the first note and the FCL name from the containers", () => {
      const fuente = {
        datosPrincipales: { idtipocarga: { id: 3 }, nombre: "ZEVALLOS", containers: [{ code: "20ST" }, { code: "40HC" }] } as DatosPrincipales,
        listShipment: [
          { id: 3, code: "LCL" },
          { id: 2, code: "FCL" },
        ],
        opcionCostos: [opcion()],
        nombre_cotizacion: "",
      };

      expect(getNombreCotizacion(fuente)).toBe("COTIZACION SALIDAS SEMANALES ZEVALLOS");
      fuente.datosPrincipales.idtipocarga = 2;
      expect(getNombreCotizacion(fuente)).toBe("COTIZACION 20ST_40HC FCL ZEVALLOS");
      expect(fuente.nombre_cotizacion).toBe("COTIZACION 20ST_40HC FCL ZEVALLOS");
    });
  });

  describe("reports", () => {
    test.each(["AGRUPADO", "DETALLE", "TOTAL"])("generarReporte posts the %s totals of the chosen option", async (tipo) => {
      const pricing = cotizacion();

      await pricing.generarReporte({ tipo, nro_propuesta: 1, tipoCotizacion: "individual", fecha_salida: "2026-11-01", nombre_cliente: "ZEVALLOS" });

      expect(postedBody("quote_preview_totales")).toMatchSnapshot();
      expect(window.open).toHaveBeenCalledWith(URL_MAIN + "files/x.pdf", "_blank");
    });

    test("generarReporte names the WhatsApp PDF after the quote type, the consolidated load and the client", async () => {
      const pricing = cotizacion();

      await pricing.generarReporte({ tipo: "TOTAL", enviarWspCliente: true, textWhatsapp: "hola" });

      const body = postedBody("quote_preview_totales") as Record<string, unknown>;
      expect([body.nombrePdfEnviarCliente, body.enviarWspCliente, body.textWhatsapp]).toEqual(["COTIZACION_INDIVIDUAL_CONSOLIDADOS_ZEVALLOS_ALFONSO", true, "hola"]);
      expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", title: "Mensaje Enviado", showConfirmButton: true });
      expect(window.open).not.toHaveBeenCalled();
    });

    test.each([
      [false, "El PDF se descargará automaticamente", 1],
      [true, "Se ha guardado los archivos correctamente.", 0],
    ])("generarReporte with guardarFlag %s says %j and opens the PDF %i times", async (guardarFlag, text, opened) => {
      const pricing = cotizacion();

      await pricing.generarReporte({ tipo: "TOTAL", guardarFlag });

      expect((postedBody("quote_preview_totales") as Record<string, unknown>).guardarFlag).toBe(guardarFlag);
      expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", title: "PDF Generado", text, showConfirmButton: true });
      expect(window.open).toHaveBeenCalledTimes(opened);
    });

    test("generarReporte reports a WhatsApp message the backend could not send", async () => {
      postMock.mockResolvedValue({ data: { estadoflag: false, error: "whatsapp down" } });
      const pricing = cotizacion();

      await pricing.generarReporte({ tipo: "TOTAL", enviarWspCliente: true, textWhatsapp: "hola" });

      expect(Swal.fire).toHaveBeenCalledWith({
        icon: "error",
        title: "Ocurrió un error. Comuníquese con el administrador del sistema",
        showConfirmButton: true,
      });
      expect(console.error).toHaveBeenCalledWith("whatsapp down");
      expect(window.open).not.toHaveBeenCalled();
    });

    test.each(["AGRUPADO", "TOTAL"])("predata resolves the %s preview of every selected option", async (tipo) => {
      vi.useFakeTimers();
      const pricing = cotizacion();
      pricing.opcionCostos = [opcion(), opcion({ nro_propuesta: 2, selected: false })];

      const pending = pricing.predata({ tipo });
      await vi.advanceTimersByTimeAsync(1100);

      expect(await pending).toMatchSnapshot();
    });

    test("predata resolves the preview of every selected option", async () => {
      vi.useFakeTimers();
      const pricing = cotizacion();
      pricing.opcionCostos = [opcion(), opcion({ nro_propuesta: 2, selected: false })];

      const pending = pricing.predata({ tipo: "DETALLE" });
      await vi.advanceTimersByTimeAsync(1100);

      expect(await pending).toMatchSnapshot();
    });

    test("imprimiReporteListado posts the filters and opens the PDF", async () => {
      const pricing = usePricingStore();
      pricing.filtro = { fechainicio: "2026-01-01", fechafin: "2026-10-31", tipopdf: 2 };

      await pricing.imprimiReporteListado({ filtroSeleccionado: { a: 1 }, filtroCabecera: { b: 2 } });

      expect(postedBody("export_list_quote")).toEqual({ filtro: { fechainicio: "2026-01-01", fechafin: "2026-10-31", tipopdf: 2 }, filtroSeleccionado: { a: 1 }, filtroCabecera: { b: 2 } });
      expect(window.open).toHaveBeenCalledWith(URL_MAIN + "files/x.pdf", "_blank");
    });

    test("imprimiReporteListadoCalls posts the calls filters and warns when the PDF fails", async () => {
      postMock.mockResolvedValue({ data: { estadoflag: false } });
      const pricing = usePricingStore();
      pricing.filtroCalls = { fechainicio: "2026-02-01", fechafin: "2026-02-28", tipopdf: 1 };

      await pricing.imprimiReporteListadoCalls({});

      expect(postedBody("reporte_llamadas_export")).toEqual({ filtro: { fechainicio: "2026-02-01", fechafin: "2026-02-28", tipopdf: 1 }, filtroSeleccionado: {}, filtroCabecera: {} });
      expect(Swal.close).toHaveBeenCalled();
      expect(vi.mocked(Swal.fire).mock.calls[vi.mocked(Swal.fire).mock.calls.length - 1]![0]).toMatchObject({ icon: "warning" });
    });

    test("imprimirMercadeo maps the filter status to 1, 0 or empty", async () => {
      respond({ listado_cotizacion_mercadeo: { estadoflag: true, path: "m.pdf" } });
      const pricing = usePricingStore();
      pricing.filtro = { fechainicio: "2026-01-01", fechafin: "2026-10-31", tipopdf: 1, id_marketing: 5, estado: "eliminado" };

      await pricing.imprimirMercadeo();

      expect(sentConfig("listado_cotizacion_mercadeo")!.data).toEqual({
        id_branch: 1,
        filtro: { id_entities: "", id_marketing: 5, id_status: "", id_modality: "", id_shipment: "", id_incoterm: "", fechainicio: "2026-01-01", fechafin: "2026-10-31", estado: "0" },
      });
      expect(window.open).toHaveBeenCalledWith(URL_MAIN + "m.pdf", "_blank");
    });

    test("exportarExcelListadoQuote posts the paged filter and downloads the workbook", async () => {
      postMock.mockResolvedValue({ data: new ArrayBuffer(2) });
      vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:x") });
      const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      const pricing = usePricingStore();
      pricing.filtro = { fechainicio: "2026-01-01", fechafin: "2026-10-31", tipopdf: 1 };
      pricing.search = "abc";

      await pricing.exportarExcelListadoQuote();

      expect(postedBody("export_list_quote_xls")).toEqual({
        filtro: { fechainicio: "2026-01-01", fechafin: "2026-10-31", tipopdf: 1, search: "abc", limit: 10, pagina: 1, id_branch: 1 },
        id_branch: 1,
      });
      expect(postMock.mock.calls[0]![2]).toMatchObject({ responseType: "arraybuffer" });
      expect(click).toHaveBeenCalled();
      vi.unstubAllGlobals();
    });
  });

  describe("instructivo", () => {
    function instructivo() {
      const pricing = cotizacion();
      pricing.listInstructivo = [
        { notas: "NOTA", code_house: "H1", code_master: null, expediente: "EXP1", sentido: "IMPORTACION", carga: "LCL", incoterms: "FOB", direccion: "CALLE 1", proveedor: "PROV", origen: "CALLAO", destino: "SHANGHAI", fiscal: "F", ruc: "R" },
      ];
      rootState.provedores = [
        { id: 40, namelong: "NAVIERA UNO" },
        { id: 41, namelong: "AGENTE DOS" },
      ];
      useMasterusuariosStore().lstPercepcionAduana = [{ id: 53, descripcion: "PRIMERA IMPORTACION" }];
      return pricing;
    }

    test("generaInstructivo lists the services, the seller and the income, cost and tax lines of the selected options", async () => {
      const pricing = instructivo();
      pricing.tiporeporte = "DETALLE";

      pricing.generaInstructivo();
      await flushPromises();

      expect(pricing.listServiciosInstructivo).toEqual([
        { name: "FLETE", status: "SI" },
        { name: "LOCALES", status: "SI" },
        { name: "ADUANA", status: "NO" },
        { name: "ALMACEN", status: "SI" },
        { name: "IMPUESTOS", status: "SI" },
      ]);
      expect(pricing.vendedor).toBe("ANA PRICING");
      expect({
        ingresos: pricing.listIngresosInstructivo,
        costos: pricing.listCostosInstructivo,
        impuestos: pricing.listImpuestosInstructivo,
        totalIngresos: pricing.totalIngresos,
        totalCostos: pricing.totalCostos,
      }).toMatchSnapshot();
    });

    test.each(["AGRUPADO", "TOTAL"])("generaInstructivo builds the %s income, cost and tax lines", async (tipo) => {
      const pricing = instructivo();
      pricing.tiporeporte = tipo;

      pricing.generaInstructivo();
      await flushPromises();

      expect({
        ingresos: pricing.listIngresosInstructivo,
        costos: pricing.listCostosInstructivo,
        impuestos: pricing.listImpuestosInstructivo,
        totalIngresos: pricing.totalIngresos,
        totalCostos: pricing.totalCostos,
      }).toMatchSnapshot();
    });

    test("generaInstructivoparaguardata builds the income and cost lines grouped by type and provider", async () => {
      const pricing = instructivo();

      await pricing.generaInstructivoparaguardata();

      expect(pricing.listIngresosInstructivoAprobar).toMatchSnapshot();
    });

    test("generaInstructivoparaguardata does nothing without the instructivo data", async () => {
      const pricing = cotizacion();
      pricing.listIngresosInstructivoAprobar = [{ dataIngresos: [], dataCostos: [], dataVentas: [], totalIngresos: 1, totalCostos: 1 }];

      await pricing.generaInstructivoparaguardata();

      expect(pricing.listIngresosInstructivoAprobar).toEqual([]);
    });

    test("GuardaCostosFinalesQuote posts the final income and cost lines of the first option", async () => {
      const pricing = instructivo();
      pricing.id = 77;
      pricing.vendedor = "ANA PRICING";

      await pricing.GuardaCostosFinalesQuote();

      expect(postedBody("insert_monto_finales_quote")).toMatchSnapshot();
    });

    test("GuardaCostosFinalesQuote does nothing without the instructivo data", async () => {
      const pricing = cotizacion();

      await pricing.GuardaCostosFinalesQuote();

      expect(postMock).not.toHaveBeenCalled();
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    test("GuardaCostosFinalesQuote warns and posts nothing when no option gives income or cost lines", async () => {
      const pricing = instructivo();
      pricing.opcionCostos = [opcion({ selected: false })];

      await pricing.GuardaCostosFinalesQuote();

      expect(postMock).not.toHaveBeenCalled();
      expect(Swal.fire).toHaveBeenCalledWith({
        icon: "error",
        title: "Ocurrió un error",
        text: "No se pudieron calcular los ingresos y costos del instructivo. Verifique que existan opciones seleccionadas y costos configurados.",
        showConfirmButton: true,
      });
    });

    test.each([
      [false, 1],
      [true, 0],
    ])("quotePreviewInstructivoManual with guardarFlag %s opens the PDF %i times", async (guardarFlag, opened) => {
      respond({ quote_preview_instructivo_manual: { path: "files/manual.pdf" } });
      const pricing = usePricingStore();

      await pricing.quotePreviewInstructivoManual({ id: 77, guardarFlag });

      expect(sentConfig("quote_preview_instructivo_manual")).toEqual({
        method: "put",
        url: URL_MAIN + "quote_preview_instructivo_manual",
        data: { id: 77, guardarFlag },
        headers: JSON_HEADERS,
      });
      expect(window.open).toHaveBeenCalledTimes(opened);
      if (opened) expect(window.open).toHaveBeenCalledWith(URL_MAIN + "files/manual.pdf", "_blank");
    });

    test("imprimirInstructivoQuote posts the instructivo of the chosen option with the totals and the profit", async () => {
      const pricing = instructivo();
      pricing.listIngresosInstructivo = [{ nro_propuesta: 1, opcion: [{ descripcion: "FLETE", valor: 100 }] }];
      pricing.listCostosInstructivo = [{ nro_propuesta: 1, opcion: [{ proveedor: "NAVIERA UNO", valor: 60 }] }];
      pricing.listImpuestosInstructivo = [{ nro_propuesta: 1, opcion: [{ name: "IGV" }] }];
      pricing.totalIngresos = 1234.567;
      pricing.totalCostos = 1000.1;

      await pricing.imprimirInstructivoQuote({ nro_propuesta: 1 });

      expect(postedBody("quote_instructivo")).toMatchSnapshot();
      expect(window.open).toHaveBeenCalledWith(URL_MAIN + "files/x.pdf", "_blank");
    });

    test("aprobarCotizacion sends the idempotency key, files the new master and goes to the expense control on confirm", async () => {
      respond({ aprobar_cotizacion: accepted([{ id_master: 900, code_master: "M-900" }]) });
      const pricing = usePricingStore();
      pricing.datosPrincipales = { nombre: "ZEVALLOS" };
      pricing.selectedFile = [{ id: "f1" }, { id: "f2" }];

      await pricing.aprobarCotizacion({ IdempotencyKey: "key-1", nuevoexpediente: true });
      await flushPromises();

      expect(sentConfig("aprobar_cotizacion")!.headers).toEqual({ "Content-Type": "application/json", "idempotency-key": "key-1" });
      expect(guardarCarpetaHouse).toHaveBeenCalledWith({ nroMaster: "M-900 - ZEVALLOS", id: 900, idSelectedFile: ["f1", "f2"] });
      expect(imprimirGuardarControlDetallado).toHaveBeenCalledWith({ guardarEnCarpeta: false, asociadoflag: true, id: 900, id_branch: 1 });
      expect(store.dispatch).not.toHaveBeenCalled();
      expect(router.push).toHaveBeenCalledWith({ name: "editControlGasto", params: { id: 900, id_branch: 1 } });
    });

    test("aprobarCotizacion moves the files to the existing folder when the quote joins an existing file", async () => {
      respond({ aprobar_cotizacion: accepted([{ id_master: 901, code_master: "M-901" }]) });
      vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
      const pricing = usePricingStore();
      pricing.datosPrincipales = { nombre: "ZEVALLOS" };
      pricing.selectedFile = [{ id: "f3" }];

      await pricing.aprobarCotizacion({ IdempotencyKey: "key-2", nuevoexpediente: false, url_folderonedrive: "https://drive/m" });
      await flushPromises();

      expect(moveFileToOneDrive).toHaveBeenCalledWith({ destinationFolderUrl: "https://drive/m", nroMaster: "M-901 - ZEVALLOS", id: 901, fileIds: ["f3"] });
      expect(imprimirGuardarControlDetallado).toHaveBeenCalledWith({ guardarEnCarpeta: false, asociadoflag: true, id: 901, id_branch: 1 });
      expect(router.push).not.toHaveBeenCalled();
    });

    test("aprobarCotizacion shows an error icon when the backend refuses the approval", async () => {
      respond({ aprobar_cotizacion: { estadoflag: false, mensaje: "Ya fue aprobada", data: [{ id_master: 902, code_master: "M-902" }] } });
      vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
      const pricing = usePricingStore();
      pricing.datosPrincipales = { nombre: "ZEVALLOS" };

      await pricing.aprobarCotizacion({ IdempotencyKey: "key-3", nuevoexpediente: true });
      await flushPromises();

      expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", title: "Aviso", text: "Ya fue aprobada" });
    });

    describe("when the user picks the emails", () => {
      const params = router.currentRoute.value.params as Record<string, unknown>;
      afterEach(() => delete params.id);

      test("aprobarCotizacion goes back to the quote on its last step", async () => {
        vi.useFakeTimers();
        params.id = "12895";
        respond({ aprobar_cotizacion: accepted([{ id_master: 903, code_master: "M-903" }]) });
        vi.mocked(Swal.fire).mockResolvedValue({ isDenied: true } as never);
        const pricing = usePricingStore();
        pricing.datosPrincipales = { nombre: "ZEVALLOS" };

        await pricing.aprobarCotizacion({ IdempotencyKey: "key-4", nuevoexpediente: true });
        await flushPromises();

        expect(router.push).toHaveBeenCalledWith({ name: "verQuote", params: { id: "12895", step: 5 } });
      });

      test("aprobarCotizacion only warns when the route has no quote id", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        respond({ aprobar_cotizacion: accepted([{ id_master: 904, code_master: "M-904" }]) });
        vi.mocked(Swal.fire).mockResolvedValue({ isDenied: true } as never);
        const pricing = usePricingStore();
        pricing.datosPrincipales = { nombre: "ZEVALLOS" };

        await pricing.aprobarCotizacion({ IdempotencyKey: "key-5", nuevoexpediente: true });
        await flushPromises();

        expect(warn).toHaveBeenCalledWith("No se encontró el ID en la ruta actual");
        expect(router.push).not.toHaveBeenCalled();
      });
    });
  });

  describe("other requests", () => {
    test("getTextoWhatsapp stamps the branch on the caller's params", async () => {
      respond({ get_texto_whatsapp: accepted([{ texto_link: "link" }]) });
      const pricing = usePricingStore();
      const params = { id_shipment: 3, id_quote: 77, id_containers: "" };

      await pricing.getTextoWhatsapp(params);

      expect(params).toEqual({ id_shipment: 3, id_quote: 77, id_containers: "", id_branch: 1 });
      expect(pricing.textWhatsapp).toEqual([{ texto_link: "link" }]);
    });

    test("crearCarpetaOneDrive returns the new folder url, or null when the request fails", async () => {
      respond({ "crear-carpeta-cotizacion": accepted("https://drive/new") });
      const pricing = usePricingStore();

      await expect(pricing.crearCarpetaOneDrive({ nro_quote: "15000-P", nombre: "ZEVALLOS" })).resolves.toBe("https://drive/new");
      expect(sentConfig("crear-carpeta-cotizacion")!.url).toBe(URL_MAIN + "crear-carpeta-cotizacion?nombrecotizacion=15000-P-ZEVALLOS");

      respond({ "crear-carpeta-cotizacion": new Error("down") });
      await expect(pricing.crearCarpetaOneDrive({})).resolves.toBeNull();
    });

    test("getInstructivoId and obtenerDatosEmpresa read the quote instructivo and the branch data", async () => {
      respond({ "getInstructivoId/77": accepted([{ expediente: "E" }]), "getBranch/1": accepted([{ business_name: "PIC" }]) });
      const pricing = usePricingStore();

      await pricing.getInstructivoId({ id: 77 });
      await pricing.obtenerDatosEmpresa();

      expect(sentConfig("getInstructivoId/77")!.data).toEqual({ id_branch: 1 });
      expect(pricing.listInstructivo).toEqual([{ expediente: "E" }]);
      expect(toRaw(useAduanaStore().listInstructivo)).toBe(toRaw(pricing.listInstructivo));
      expect(pricing.datosEmpresa).toEqual([{ business_name: "PIC" }]);
    });

    test("getServices, obtenerCostosPricing, getImpuestos and getCargarMasterDetalleNotasCotizacion fill pricing and aduana", async () => {
      respond({
        obtener_servicio_pricing: accepted([{ id: 1 }]),
        obtener_costos_pricing: accepted([{ id: 2 }]),
        cargar_master_detalle_impuesto: accepted([{ id: 3 }]),
        cargar_master_detalle_notas_cotizacion: rejected("Sin notas"),
      });
      const pricing = usePricingStore();

      await pricing.getServices();
      await pricing.obtenerCostosPricing();
      await pricing.getImpuestos();
      pricing.getCargarMasterDetalleNotasCotizacion();
      await flushPromises();

      expect([pricing.preServices, pricing.preCostos, pricing.listImpuestos, pricing.listNotasQuote]).toEqual([[{ id: 1 }], [{ id: 2 }], [{ id: 3 }], []]);
      const aduana = useAduanaStore();
      for (const key of ["preServices", "preCostos", "listImpuestos", "listNotasQuote"] as const) expect(toRaw(aduana[key])).toBe(toRaw(pricing[key]));
      expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "Sin notas" });
    });

    test.each([
      [true, "info"],
      [false, "error"],
    ])("setNoteQuote posts the note and shows an %s answer with the %s icon", async (estadoflag, icon) => {
      respond({ quote_note_insert: { estadoflag, mensaje: "Nota registrada" } });
      const pricing = usePricingStore();

      await pricing.setNoteQuote({ id_quote: 77, nota: "LLAMAR" });

      expect(sentConfig("quote_note_insert")).toEqual({
        method: "post",
        url: URL_MAIN + "quote_note_insert",
        headers: JSON_HEADERS,
        data: { id_quote: 77, nota: "LLAMAR" },
      });
      expect(Swal.fire).toHaveBeenCalledWith({ icon, title: "Aviso", text: "Nota registrada" });
    });

    test.each([
      [true, "info"],
      [false, "error"],
    ])("actualizarQuoteRecibidoEnviado puts the flags and shows an %s answer with the %s icon", async (estadoflag, icon) => {
      respond({ update_quote_recibido_enviado: { estadoflag, mensaje: "Actualizado" } });
      const pricing = usePricingStore();

      await pricing.actualizarQuoteRecibidoEnviado({ id: 77, recibidoflag: true });
      await flushPromises();

      expect(sentConfig("update_quote_recibido_enviado")).toEqual({
        method: "put",
        url: URL_MAIN + "update_quote_recibido_enviado",
        headers: JSON_HEADERS,
        data: { id: 77, recibidoflag: true },
      });
      expect(Swal.fire).toHaveBeenCalledWith({ icon, text: "Actualizado" });
    });
  });
});

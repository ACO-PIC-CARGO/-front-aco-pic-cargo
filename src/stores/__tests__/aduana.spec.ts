import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { toRaw } from "vue";
import Swal from "sweetalert2";
import http from "@/api/http";
import router from "@/router";
import { useAppStore } from "@/stores/app";
import { useAduanaStore } from "@/stores/aduana";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";
import { useEnterprisesStore } from "@/stores/enterprises";
import { usePricingStore } from "@/stores/pricing";
import type { Costo, DatosPrincipales, Impuesto, Multiplicador, Nota, OpcionCosto, Servicio } from "@/types/cotizacion";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

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
  { id: 13, nameservice: "VISTOS BUENOS", eslocalflag: 1, esventaflag: 1, esopcionflag: 0, status: 1, id_multiplicador: 2, costounitario: "35", minimo: 100, code_cost: 3, id_groupservices: 7 },
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
  id_marketing: 8,
  id_status: 3,
  id_vendedor: 4,
  id_pricing: 4,
  id_entitie: 2142,
  nombre: "ZEVALLOS ALFONSO",
  telefono: "+51997300697",
  idsentido: 1,
  idtipocarga: 3,
  idincoterms: 9,
  idorigen: 346,
  iddestino: 207,
  volumen: 2.5,
  peso: 1200,
  amount: 5000,
  numerobultos: 3,
  containers: [],
  proveedor: "PROV",
  telefonoproveedor: "111",
  direccionproveedor: "CALLE 2",
  iddistrito: 690,
  idprovincia: 67,
  id_percepcionaduana: 53,
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
const SECCIONES = [
  { codigo: "FL", name: "FLETE" },
  { codigo: "OR", name: "ORIGEN" },
  { codigo: "LO", name: "LOCALES" },
  { codigo: "AD", name: "ADUANA" },
  { codigo: "AL", name: "ALMACEN" },
  { codigo: "GT", name: "GASTOS DE TERCEROS" },
];

function cotizacion() {
  usePricingStore().listMultiplicador = clone(MULTIPLICADORES);
  const aduana = useAduanaStore();
  aduana.listMultiplicador = clone(MULTIPLICADORES);
  aduana.listServices = clone(SERVICIOS);
  aduana.datosPrincipales = clone(DATOS);
  aduana.opcionCostos = [opcion()];
  aduana.listModality = [{ id: 1, code: "I", name: "IMPORTACION", description: null, status: 1 }];
  aduana.listShipment = [
    { id: 3, code: "LCL", embarque: "LCL" },
    { id: 2, code: "FCL", embarque: "FCL" },
  ];
  aduana.listIncoterms = [{ id: 9, name: "FOB" }];
  aduana.listPortBegin = [{ id_port: 346, name: "SHANGHAI" }];
  aduana.listPortEnd = [{ id_port: 207, name: "CALLAO" }];
  aduana.namesection = clone(SECCIONES);
  aduana.listTipoCostos = clone(SECCIONES);
  aduana.datosEmpresa = [{ business_name: "PIC LOGISTICA", address: "AV 1", iso_pais: 9589, pais: "PERU", document: "2060", phone: "999" }];
  aduana.listEjecutivo = [{ id_entitie: 4, name: "ANA PRICING" }];
  aduana.nro_quote = "14-A";
  return aduana;
}

describe("aduana store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1, nombrecompleto: "ANA PRICING", path: "logo.png" }]));
    sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 1, trade_name: "PIC LOGISTICA SAC" }]));
    sessionStorage.setItem("iso_pais", "9589");
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
    postMock.mockResolvedValue({ data: { estadoflag: true, path: "files/x.pdf", mensaje: "ok" } });
    useEnterprisesStore().impuesto = { impuesto: 18, nombre_impuesto: "IGV" };
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(window, "open").mockImplementation(() => null);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("lists", () => {
    test("ListarMontosFinalesAduanaMONGODB copies the file number into quote and keeps the token", async () => {
      respond({ listar_montos_finales_aduana: accepted([{ id: 5, expediente: "EXP-5" }]) });
      const aduana = useAduanaStore();

      await aduana.ListarMontosFinalesAduanaMONGODB();

      expect(sentConfig("listar_montos_finales_aduana")).toEqual({
        method: "get",
        url: URL_MAIN + "listar_montos_finales_aduana",
        params: { id_branch: 1 },
        headers: JSON_HEADERS,
      });
      expect(aduana.listQuotes2).toEqual([{ id: 5, expediente: "EXP-5", quote: "EXP-5" }]);
      expect(sessionStorage.getItem("auth-token")).toBe("tok");
    });

    test("ListarMontosFinalesAduanaMONGODB keeps the list on a rejection and logs a failed request", async () => {
      respond({ listar_montos_finales_aduana: rejected() });
      const aduana = useAduanaStore();
      aduana.listQuotes2 = [{ id: 1 }];

      await aduana.ListarMontosFinalesAduanaMONGODB();
      respond({ listar_montos_finales_aduana: new Error("down") });
      await aduana.ListarMontosFinalesAduanaMONGODB();

      expect(aduana.listQuotes2).toEqual([{ id: 1 }]);
      expect(console.error).toHaveBeenCalledWith("Error al listar montos finales quote:", new Error("down"));
    });

    test("cargarListadoQuoteAduana fills the house quote list only when the backend accepts", async () => {
      respond({ cargar__quote_aduana: accepted([{ id: 14, quote: "1-A" }]) });
      const aduana = useAduanaStore();

      await aduana.cargarListadoQuoteAduana();
      respond({ cargar__quote_aduana: rejected() });
      await aduana.cargarListadoQuoteAduana();

      expect(sentConfig("cargar__quote_aduana")).toEqual({
        method: "get",
        url: URL_MAIN + "cargar__quote_aduana",
        params: { id_branch: 1 },
        headers: JSON_HEADERS,
      });
      expect(aduana.listQuotes2).toEqual([{ id: 14, quote: "1-A" }]);
    });

    test("getServicesAduana fills the default services for aduana and pricing only when the backend accepts", async () => {
      respond({ obtenerListadoServiciosAduanaQuote: accepted([{ id: 28, service: "SEGURO" }]) });
      const aduana = useAduanaStore();

      await aduana.getServicesAduana();
      respond({ obtenerListadoServiciosAduanaQuote: rejected() });
      await aduana.getServicesAduana();

      expect(sentConfig("obtenerListadoServiciosAduanaQuote")!.params).toEqual({ id_branch: 1 });
      expect(aduana.preServices).toEqual([{ id: 28, service: "SEGURO" }]);
      expect(toRaw(usePricingStore().preServices)).toBe(toRaw(aduana.preServices));
    });

    test.each([
      ["getCotizacionUnificar", "obtener_cotizacion_unificar"],
      ["getAduanaUnificar", "obtener_aduana_unificar"],
    ] as const)("%s keeps the raw rows, gives pricing the keyed rows and empties both on a rejection", async (action, path) => {
      const rows = [{ id: 9 }, { code: "A" }];
      respond({ [path]: accepted(rows) });
      const aduana = useAduanaStore();

      await aduana[action](14);

      expect(sentConfig(path)).toEqual({ method: "get", url: URL_MAIN + path, params: { id: 14 }, headers: JSON_HEADERS });
      expect(aduana.listQuotes).toEqual(rows);
      expect(usePricingStore().listQuotes).toEqual([
        { id: 9, rowId: "9_0" },
        { code: "A", rowId: "quote_1" },
      ]);

      respond({ [path]: rejected() });
      await aduana[action](14);

      expect([aduana.listQuotes, usePricingStore().listQuotes]).toEqual([[], []]);
    });

    test("getPersonalPricingAduana loads the pricing executives for aduana and pricing", async () => {
      respond({ get_personal_pricing: accepted([{ id_entitie: 4, name: "ANA" }]) });
      const aduana = useAduanaStore();

      await aduana.getPersonalPricingAduana();

      expect(sentConfig("get_personal_pricing")).toEqual({ method: "get", url: URL_MAIN + "get_personal_pricing?id_branch=1", headers: JSON_HEADERS });
      expect(aduana.listEjecutivo).toEqual([{ id_entitie: 4, name: "ANA" }]);
      expect(toRaw(usePricingStore().listEjecutivo)).toBe(toRaw(aduana.listEjecutivo));
    });

    test.each([
      ["a selected shipment row", { id: 3, code: "LCL" }],
      ["a shipment id", 3],
    ] as const)("getItemsServices posts the quote combination with %s and fills both service lists of aduana and pricing", async (_, idtipocarga) => {
      respond({ getItemsServices: accepted([{ id: 1, service: "FLETE" }]) });
      const aduana = useAduanaStore();
      aduana.datosPrincipales = { idincoterms: 9, idsentido: 1, idtipocarga };

      await aduana.getItemsServices();

      expect(sentConfig("getItemsServices")).toEqual({
        method: "post",
        url: URL_MAIN + "getItemsServices",
        headers: JSON_HEADERS,
        data: { id_branch: 1, id_incoterms: 9, id_modality: 1, id_shipment: 3 },
      });
      const pricing = usePricingStore();
      expect(aduana.listServices).toEqual([{ id: 1, service: "FLETE" }]);
      expect([aduana.copylistServices, pricing.listServices, pricing.copylistServices].map((l) => toRaw(l))).toEqual([
        toRaw(aduana.listServices),
        toRaw(aduana.listServices),
        toRaw(aduana.listServices),
      ]);
      expect(toRaw(pricing.listServices)).toBe(toRaw(aduana.listServices));
    });

    test("getItemsServices empties the services when the answer has no rows and logs a failed request", async () => {
      respond({ getItemsServices: { estadoflag: false } });
      const aduana = useAduanaStore();
      aduana.datosPrincipales = { idtipocarga: 3 };
      aduana.listServices = [{ id: 1 }];

      await aduana.getItemsServices();
      expect([aduana.listServices, usePricingStore().copylistServices]).toEqual([[], []]);

      respond({ getItemsServices: new Error("down") });
      aduana.listServices = [{ id: 2 }];
      await aduana.getItemsServices();
      expect(aduana.listServices).toEqual([{ id: 2 }]);
      expect(console.error).toHaveBeenCalledWith(new Error("down"));
    });

    test("obtenerCostosAduana loads the branch costs for aduana and pricing", async () => {
      respond({ obtener_costos_pricing: accepted([{ id: 2 }]) });
      const aduana = useAduanaStore();

      await aduana.obtenerCostosAduana();

      expect(sentConfig("obtener_costos_pricing")).toEqual({
        method: "get",
        url: URL_MAIN + "obtener_costos_pricing",
        headers: JSON_HEADERS,
        params: { id_branch: 1 },
      });
      expect(aduana.preCostos).toEqual([{ id: 2 }]);
      expect(toRaw(usePricingStore().preCostos)).toBe(toRaw(aduana.preCostos));
    });

    test("getMultiplicadorAduana posts the shipment and containers, adds value, text and a zero valor and fills pricing and configEmpresa", async () => {
      respond({
        getMultiplicador: accepted([
          { id: 1, code: 1, name: "Por embarque", valor: 25 },
          { id: 2, code: 2, name: "Por m3" },
        ]),
      });
      const aduana = useAduanaStore();
      aduana.datosPrincipales = { idtipocarga: { id: 2, code: "FCL" }, containers: [{ id_containers: 7, cantidad: 2 }] };

      await aduana.getMultiplicadorAduana();

      expect(sentConfig("getMultiplicador")).toEqual({
        method: "post",
        url: URL_MAIN + "getMultiplicador",
        data: { id_shipment: 2, containers: [{ id_containers: 7, cantidad: 2 }], id_branch: 1 },
        headers: JSON_HEADERS,
      });
      expect(aduana.listMultiplicador).toEqual([
        { id: 1, value: 1, code: 1, text: "Por embarque", valor: 25 },
        { id: 2, value: 2, code: 2, text: "Por m3", valor: 0 },
      ]);
      expect(toRaw(usePricingStore().listMultiplicador)).toBe(toRaw(aduana.listMultiplicador));
      expect(toRaw(useConfigEmpresaStore().lstMultiplicador)).toBe(toRaw(aduana.listMultiplicador));
    });

    test("getTipoCostosAduana asks for the shipment and direction and fills aduana, pricing and configEmpresa", async () => {
      respond({ tipo_costo_x_embarque: accepted(SECCIONES) });
      const aduana = useAduanaStore();
      aduana.datosPrincipales = { idtipocarga: { id: 3, code: "LCL" }, idsentido: 1 };

      await aduana.getTipoCostosAduana();

      expect(sentConfig("tipo_costo_x_embarque")).toEqual({
        method: "get",
        url: URL_MAIN + "tipo_costo_x_embarque?id_shipment=3&id_modality=1",
        headers: JSON_HEADERS,
      });
      const pricing = usePricingStore();
      expect(aduana.listTipoCostos).toEqual(SECCIONES);
      for (const list of [aduana.namesection, pricing.listTipoCostos, pricing.namesection, useConfigEmpresaStore().listTipoCostos])
        expect(toRaw(list)).toBe(toRaw(aduana.listTipoCostos));
    });

    test("getTipoCostosAduana empties every cost type list and shows the message on a rejection", async () => {
      respond({ tipo_costo_x_embarque: rejected("Sin tipos") });
      const aduana = useAduanaStore();
      aduana.datosPrincipales = { idtipocarga: 3, idsentido: 2 };
      aduana.listTipoCostos = clone(SECCIONES);

      await aduana.getTipoCostosAduana();

      expect(sentConfig("tipo_costo_x_embarque")!.url).toBe(URL_MAIN + "tipo_costo_x_embarque?id_shipment=3&id_modality=2");
      expect([aduana.listTipoCostos, usePricingStore().namesection, useConfigEmpresaStore().listTipoCostos]).toEqual([[], [], []]);
      expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "Sin tipos" });
    });

    test.each([
      ["getModalityAduana", "getModality", "listModality"],
      ["getShipmentAduana", "getShipment", "listShipment"],
      ["getIncotermsAduana", "getIncoterms", "listIncoterms"],
    ] as const)("%s posts the branch and fills aduana's and pricing's %s", async (action, path, list) => {
      const rows = [{ id: 1, name: "X" }];
      respond({ [path]: accepted(rows) });
      const aduana = useAduanaStore();

      await aduana[action]();

      expect(sentConfig(path)).toEqual({ method: "post", url: URL_MAIN + path, headers: JSON_HEADERS, data: { id_branch: 1 } });
      expect(aduana[list]).toEqual(rows);
      expect(toRaw(usePricingStore()[list])).toBe(toRaw(aduana[list]));
    });

    test.each([
      ["getPortBeginAduana", "getPortBegin", "listPortBegin"],
      ["getPortEndAduana", "getPortEnd", "listPortEnd"],
    ] as const)("%s posts the search with its defaults and fills aduana's and pricing's %s", async (action, path, list) => {
      respond({ [path]: accepted([{ id_port: 1 }]) });
      const aduana = useAduanaStore();

      await aduana[action]({});
      await aduana[action]({ id_transport: 1, id: 343, search: "sha" });

      expect(httpMock.mock.calls.map(([config]) => config)).toEqual([
        { method: "post", url: URL_MAIN + path, headers: JSON_HEADERS, data: { id_branch: 1, id_transport: 0, id: null, search: null } },
        { method: "post", url: URL_MAIN + path, headers: JSON_HEADERS, data: { id_branch: 1, id_transport: 1, id: 343, search: "sha" } },
      ]);
      expect(aduana[list]).toEqual([{ id_port: 1 }]);
      expect(toRaw(usePricingStore()[list])).toBe(toRaw(aduana[list]));
    });

    test.each([
      ["activo", "1"],
      ["eliminado", "0"],
      ["todos", ""],
    ])("getListQuoteAduana sends the %s filter as estado=%s, numbers the rows and hands them to pricing", async (estado, sent) => {
      respond({ listar_aduana: accepted([{ id: 14 }, { code: "B" }]) });
      const aduana = useAduanaStore();
      aduana.filtro = { id_marketing: 8, id_status: "", id_entities: 2142, id_modality: 1, id_shipment: 3, id_incoterm: 9, fechainicio: "2026-01-01", fechafin: "", estado };

      await aduana.getListQuoteAduana();

      expect(sentConfig("listar_aduana")).toEqual({
        method: "get",
        url:
          URL_MAIN +
          `listar_aduana?id_branch=1&id_marketing=8&id_status=&id_entities=2142&id_modality=1&id_shipment=3&id_incoterm=9&fechainicio=2026-01-01&fechafin=&estado=${sent}`,
        headers: JSON_HEADERS,
        data: { id_branch: 1 },
      });
      expect(aduana.listQuotes).toEqual([
        { id: 14, index: 0 },
        { code: "B", index: 1 },
      ]);
      expect(usePricingStore().listQuotes).toEqual([
        { id: 14, index: 0, rowId: "14_0" },
        { code: "B", index: 1, rowId: "quote_1" },
      ]);
      expect(sessionStorage.getItem("auth-token")).toBe("tok");
    });

    test("getListQuoteAduana empties the lists on a rejection and sends an expired session to Login", async () => {
      vi.useFakeTimers();
      respond({ listar_aduana: rejected("Sesión expirada", "401") });
      const aduana = useAduanaStore();
      aduana.listQuotes = [{ id: 1 }];

      await aduana.getListQuoteAduana();
      await flushPromises();

      expect([aduana.listQuotes, usePricingStore().listQuotes]).toEqual([[], []]);
      expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "Sesión expirada", allowOutsideClick: false, allowEscapeKey: false, allowEnterKey: false });
      expect(router.push).toHaveBeenCalledWith({ name: "Login" });
    });

    test.each([
      ["activo", "1"],
      ["eliminado", "0"],
      [true, ""],
    ] as const)("getQuoteCallAduana sends the %s calls filter as estado=%s and keys pricing's calls by id and position", async (estado, sent) => {
      respond({ list_calls_aduana: accepted([{ id: 7 }, { id: 7 }]) });
      const aduana = useAduanaStore();
      aduana.filtroCalls = { id_marketing: "", id_status: 3, id_entities: "", id_modality: "", id_shipment: "", id_incoterm: "", fechainicio: "", fechafin: "2026-10-31", estado };

      await aduana.getQuoteCallAduana({ id_estado: 1, id_sentido: 2, id_carga: 3, id_incoterms: 4, desde: "a", hasta: "b" });

      expect(sentConfig("list_calls_aduana")).toEqual({
        method: "get",
        url: URL_MAIN + `list_calls_aduana?id_branch=1&id_marketing=&id_status=3&id_entities=&id_modality=&id_shipment=&id_incoterm=&fechainicio=&fechafin=2026-10-31&estado=${sent}`,
        headers: JSON_HEADERS,
        data: { id_branch: 1, id_estado: 1, id_sentido: 2, id_carga: 3, id_incoterms: 4, desde: "a", hasta: "b" },
      });
      expect(usePricingStore().listCall).toEqual([
        { id: 7, rowId: "7_0" },
        { id: 7, rowId: "7_1" },
      ]);
    });

    test("getQuoteCallAduana empties pricing's calls on a rejection and sends an expired session to Login", async () => {
      vi.useFakeTimers();
      respond({ list_calls_aduana: rejected("Sesión expirada", "401") });
      const aduana = useAduanaStore();
      usePricingStore().listCall = [{ id: 1 }];

      await aduana.getQuoteCallAduana({});
      await flushPromises();

      expect(usePricingStore().listCall).toEqual([]);
      expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "Sesión expirada", allowOutsideClick: false, allowEscapeKey: false, allowEnterKey: false });
      expect(router.push).toHaveBeenCalledWith({ name: "Login" });
    });

    test("getCargarMasterDetalleNotasCotizacionAduana fills the notes of aduana and pricing, or empties them with a message", async () => {
      respond({ cargar_master_detalle_notas_cotizacion: accepted([{ id: 1, descripcion: "N" }]) });
      const aduana = useAduanaStore();

      aduana.getCargarMasterDetalleNotasCotizacionAduana();
      await flushPromises();

      expect(sentConfig("cargar_master_detalle_notas_cotizacion")).toEqual({
        method: "post",
        url: URL_MAIN + "cargar_master_detalle_notas_cotizacion?id_branch=1",
        headers: JSON_HEADERS,
      });
      expect(aduana.listNotasQuote).toEqual([{ id: 1, descripcion: "N" }]);
      expect(toRaw(usePricingStore().listNotasQuote)).toBe(toRaw(aduana.listNotasQuote));

      respond({ cargar_master_detalle_notas_cotizacion: rejected("Sin notas") });
      aduana.getCargarMasterDetalleNotasCotizacionAduana();
      await flushPromises();

      expect([aduana.listNotasQuote, usePricingStore().listNotasQuote]).toEqual([[], []]);
      expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "Sin notas" });
    });

    test("obtenerDatosEmpresaAduana and getInstructivoIdAduana read the branch data and the quote instructivo", async () => {
      respond({ "getBranch/1": accepted([{ business_name: "PIC" }]), "getInstructivoIdAduana/14": accepted([{ expediente: "E" }]) });
      const aduana = useAduanaStore();

      await aduana.obtenerDatosEmpresaAduana();
      await aduana.getInstructivoIdAduana({ id: 14 });

      expect(sentConfig("getBranch/1")).toEqual({ method: "post", url: URL_MAIN + "getBranch/1", headers: JSON_HEADERS, data: { id_branch: 1 } });
      expect(sentConfig("getInstructivoIdAduana/14")).toEqual({
        method: "post",
        url: URL_MAIN + "getInstructivoIdAduana/14",
        headers: JSON_HEADERS,
        data: { id_branch: 1 },
      });
      expect(aduana.datosEmpresa).toEqual([{ business_name: "PIC" }]);
      expect(aduana.listInstructivo).toEqual([{ expediente: "E" }]);
      expect(toRaw(usePricingStore().listInstructivo)).toBe(toRaw(aduana.listInstructivo));
    });
  });

  describe("quote", () => {
    test("registrarAduana posts the LCL quote with formatted costs, notes, taxes and services and keeps the new id", async () => {
      respond({ "insert_aduana  ": { insertId: 77, nro_quote: "77-A", msg: "Registrado" } });
      const aduana = cotizacion();

      await aduana.registrarAduana({ fullflag: false });

      expect(sentConfig("insert_aduana  ")).toMatchSnapshot();
      expect([aduana.id, aduana.nro_quote, aduana.mensaje, aduana.tiporeporte]).toEqual([77, "77-A", "Registrado", ""]);
    });

    test("registrarAduana sends the containers and no weights for an FCL quote, and no taxes without the tax service", async () => {
      respond({ "insert_aduana  ": { insertId: 78, nro_quote: "78-A", msg: "ok" } });
      const aduana = cotizacion();
      aduana.datosPrincipales.idtipocarga = { id: 2, code: "FCL" };
      aduana.datosPrincipales.containers = [{ id_containers: 7, cantidad: 2, description: "20ST" }];
      aduana.listServices = aduana.listServices.filter((v) => v.code_service != 15);
      aduana.tiporeporte = "DETALLE";

      await aduana.registrarAduana({});

      const data = sentConfig("insert_aduana  ")!.data as Record<string, unknown>;
      expect([data.numerobultos, data.peso, data.volumen, data.contenedores, data.idtipocarga, data.fullflag, data.tiporeporte]).toEqual([
        0,
        0,
        0,
        [{ id: "", id_contenedor: 7, cantidad: 2, status: true }],
        2,
        true,
        "DETALLE",
      ]);
      expect((data.opcionCostos as { listImpuestos: unknown[] }[])[0]!.listImpuestos).toEqual([]);
    });

    test("actualizarQuoteAduana puts the edited quote with the edit formatter and shows the answer", async () => {
      respond({ actualizar_aduana: { estadoflag: true, mensaje: "Actualizado" } });
      const aduana = cotizacion();
      aduana.id = 14;
      aduana.opcionCostos = [opcion({ id: 6 })];

      await aduana.actualizarQuoteAduana();

      expect(sentConfig("actualizar_aduana")).toMatchSnapshot();
      expect(Swal.fire).toHaveBeenCalledWith({ icon: "info", text: "Actualizado" });
    });

    test("getAdunaVer loads the quote into the form, its options and flags", async () => {
      const opciones = [
        { id: 6, nro_propuesta: 1, date_end: "2025-05-31", tiempo_transito: 35, selected: true, listcostos: [{ id: 21 }], listimpuestos: [], listnotasquote: [{ id: 22 }] },
      ];
      const row = {
        id: 14,
        quote: "1-A",
        id_marketing: 8,
        statusquote: 7,
        id_vendedor: 9245,
        id_pricing: 9245,
        nombre: "PRUEBA",
        id_entitie: 2142,
        telefono: "123",
        idsentido: 1,
        idtipocarga: 3,
        idincoterms: 9,
        proveedor: null,
        telefonoproveedor: null,
        direccionproveedor: null,
        descripcionmercancia: null,
        fecha_inicio: "2025-05-28",
        iddestino: 207,
        idorigen: 346,
        numerobultos: 1,
        peso: 100,
        volumen: 1,
        servicios: [{ id: 28, service: "TRANSPORTE" }],
        monto: 1000,
        opcioncostos: opciones,
        containers: [],
        aprobadoflag: false,
        fullflag: 1,
        tiporeporte: "AGRUPADO",
        id_percepcionaduana: "53",
        statusmain: 1,
      };
      respond({ ver_aduana: accepted([row]) });
      const aduana = useAduanaStore();

      await aduana.getAdunaVer({ id: 14 });

      expect(sentConfig("ver_aduana")).toEqual({ method: "get", url: URL_MAIN + "ver_aduana?id=14", headers: JSON_HEADERS });
      expect(aduana.copy_quote).toEqual(row);
      expect([aduana.id, aduana.nro_quote, aduana.aprobadoflag, aduana.fullflag, aduana.tiporeporte, aduana.mostrarBtnActualizarFlag]).toEqual([
        14,
        "1-A",
        false,
        1,
        "AGRUPADO",
        true,
      ]);
      expect(aduana.datosPrincipales).toMatchSnapshot();
      expect(aduana.opcionCostos).toEqual([
        { id: 6, nro_propuesta: 1, date_end: "2025-05-31", tiempo_transito: 35, listCostos: [{ id: 21 }], listImpuestos: [], listNotasQuote: [{ id: 22 }], selected: true },
      ]);
      expect([aduana.listServices, aduana.copylistServices]).toEqual([row.servicios, row.servicios]);
    });

    test.each([
      [0, false, false],
      [1, true, false],
      [1, false, true],
    ])("getAdunaVer with status %i and approval %s shows the update button: %s", async (statusmain, aprobadoflag, visible) => {
      respond({ ver_aduana: accepted([{ id: 14, quote: "1-A", statusmain, aprobadoflag, servicios: [], opcioncostos: [], containers: [] }]) });
      const aduana = useAduanaStore();

      await aduana.getAdunaVer({ id: 14 });

      expect(aduana.mostrarBtnActualizarFlag).toBe(visible);
    });

    test("unificarQuoteAduana posts the pair and keeps the unified quote", async () => {
      respond({ aduana_unificar: { insertId: 99, nro_quote: "99-P", msg: "Unificado" } });
      const aduana = useAduanaStore();
      aduana.tiporeporte = "TOTAL";

      await aduana.unificarQuoteAduana({ id_quote: 12895, id_aduana: 14 });

      expect(sentConfig("aduana_unificar")).toEqual({
        method: "post",
        url: URL_MAIN + "aduana_unificar",
        headers: JSON_HEADERS,
        data: { id_quote: 12895, id_aduana: 14 },
      });
      expect([aduana.IdQuote, aduana.nro_quote, aduana.mensaje, aduana.tiporeporte]).toEqual([99, "99-P", "Unificado", ""]);
    });

    test.each([
      [true, "info"],
      [false, "error"],
    ])("actualizarAduanaRecibidoEnviado puts the flags and shows an answer with estadoflag %s as %s", async (estadoflag, icon) => {
      respond({ update_aduana_recibido_enviado: { estadoflag, mensaje: "Actualizado" } });
      const aduana = useAduanaStore();

      aduana.actualizarAduanaRecibidoEnviado({ id: 14, id_status: 3 });
      await flushPromises();

      expect(sentConfig("update_aduana_recibido_enviado")).toEqual({
        method: "put",
        url: URL_MAIN + "update_aduana_recibido_enviado",
        headers: JSON_HEADERS,
        data: { id: 14, id_status: 3 },
      });
      expect(Swal.fire).toHaveBeenCalledWith({ icon, text: "Actualizado" });
    });

    test("guardarNotaAduana posts the call note and logs a failed request", async () => {
      respond({ set_calls_aduana: accepted([]) });
      const aduana = useAduanaStore();

      await aduana.guardarNotaAduana({ id_quote: 14, comentario: "LLAMAR" });
      respond({ set_calls_aduana: new Error("down") });
      await aduana.guardarNotaAduana({ id_quote: 14 });

      expect(sentConfig("set_calls_aduana")).toEqual({
        method: "post",
        url: URL_MAIN + "set_calls_aduana",
        headers: JSON_HEADERS,
        data: { id_quote: 14, comentario: "LLAMAR" },
      });
      expect(console.error).toHaveBeenCalledWith(new Error("down"));
    });

    test.each([
      [true, "success"],
      [false, "error"],
    ])("aprobarCotizacionAduana puts the approval, shows estadoflag %s as %s and goes to the expense control on confirm", async (estadoflag, icon) => {
      respond({ aprobar_cotizacion_aduana: { estadoflag, mensaje: "Aprobada", data: [{ id_master: 900, nro_master: "M-900" }] } });
      const aduana = useAduanaStore();
      aduana.datosPrincipales = { nombre: "ZEVALLOS" };

      await aduana.aprobarCotizacionAduana({ id_quote: 14, nuevoexpediente: true });
      await flushPromises();

      expect(sentConfig("aprobar_cotizacion_aduana")).toEqual({
        method: "put",
        url: URL_MAIN + "aprobar_cotizacion_aduana",
        headers: JSON_HEADERS,
        data: { id_quote: 14, nuevoexpediente: true },
      });
      expect(Swal.fire).toHaveBeenCalledWith({
        icon,
        title: "Aviso",
        text: "Aprobada",
        timerProgressBar: true,
        allowOutsideClick: false,
        confirmButtonText: "Ir al control de gastos",
        denyButtonText: "Cerrar",
        showCancelButton: false,
        showConfirmButton: true,
        showDenyButton: true,
        confirmButtonColor: "#004D40",
        denyButtonColor: "#DD2C00",
      });
      expect(router.push).toHaveBeenCalledWith({ name: "editControlGasto", params: { id: 900, id_branch: 1 } });
    });
  });

  describe("reports", () => {
    test.each(["AGRUPADO", "DETALLE", "TOTAL"])("generarReporteAduana posts the %s totals of the chosen option and opens the PDF", async (tipo) => {
      const aduana = cotizacion();

      await aduana.generarReporteAduana({ tipo, nro_propuesta: 1 });

      expect(postedBody("quote_preview_totales")).toMatchSnapshot();
      expect(postMock.mock.calls[0]![2]).toEqual(JSON_HEADERS);
      expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", title: "PDF Generado", text: "El PDF se descargará automaticamente", showConfirmButton: true });
      expect(window.open).toHaveBeenCalledWith(URL_MAIN + "files/x.pdf", "_blank");
    });

    test("generarReporteAduana logs a failed request without opening anything", async () => {
      postMock.mockRejectedValue(new Error("down"));
      const aduana = cotizacion();

      await aduana.generarReporteAduana({ tipo: "TOTAL", nro_propuesta: 1 });

      expect(console.log).toHaveBeenCalledWith(new Error("down"));
      expect(window.open).not.toHaveBeenCalled();
    });

    test.each(["AGRUPADO", "DETALLE", "TOTAL"])("predataAduana resolves the %s preview of every selected option", async (tipo) => {
      vi.useFakeTimers();
      const aduana = cotizacion();
      aduana.opcionCostos = [opcion(), opcion({ nro_propuesta: 2, selected: false })];

      const pending = aduana.predataAduana({ tipo });
      await vi.advanceTimersByTimeAsync(1100);

      expect(await pending).toMatchSnapshot();
    });
  });

  describe("instructivo", () => {
    function instructivo() {
      const aduana = cotizacion();
      aduana.listInstructivo = [
        { expediente: "EXP1", sentido: "IMPORTACION", carga: "LCL", incoterms: "FOB", direccion: "CALLE 1", proveedor: "PROV", origen: "SHANGHAI", destino: "CALLAO", fiscal: "F", ruc: "R" },
      ];
      useAppStore().provedores = [
        { id: 40, namelong: "NAVIERA UNO" },
        { id: 41, namelong: "AGENTE DOS" },
      ] as never;
      return aduana;
    }

    test.each(["AGRUPADO", "DETALLE", "TOTAL"])(
      "generaInstructivoAduana lists the services, the seller and the %s income, cost and tax lines of the selected options",
      async (tipo) => {
        const aduana = instructivo();
        aduana.tiporeporte = tipo;

        aduana.generaInstructivoAduana();
        await flushPromises();

        expect(aduana.listServiciosInstructivo).toEqual([
          { name: "FLETE", status: "SI" },
          { name: "LOCALES", status: "SI" },
          { name: "ADUANA", status: "NO" },
          { name: "ALMACEN", status: "SI" },
          { name: "IMPUESTOS", status: "SI" },
        ]);
        expect(aduana.vendedor).toBe("ANA PRICING");
        expect({
          ingresos: aduana.listIngresosInstructivo,
          costos: aduana.listCostosInstructivo,
          impuestos: aduana.listImpuestosInstructivo,
          totalCostos: aduana.totalCostos,
        }).toMatchSnapshot();
      },
    );

    test("generaInstructivoparaguardataAduana builds the income and cost lines grouped by type and provider", async () => {
      const aduana = instructivo();

      await aduana.generaInstructivoparaguardataAduana();

      expect(aduana.vendedor).toBe("ANA PRICING");
      expect(aduana.listIngresosInstructivoAprobar).toMatchSnapshot();
    });

    test("generaInstructivoparaguardataAduana rejects without the instructivo data", async () => {
      const aduana = cotizacion();

      await expect(aduana.generaInstructivoparaguardataAduana()).rejects.toThrow(TypeError);
    });

    test("GuardaCostosFinalesAduana posts the final income and cost lines of the first selected option", async () => {
      const aduana = instructivo();
      aduana.id = 14;

      await aduana.GuardaCostosFinalesAduana();

      expect(postedBody("insert_monto_finales_aduana")).toMatchSnapshot();
      expect(postMock.mock.calls[0]![2]).toEqual(JSON_HEADERS);
    });

    test("GuardaCostosFinalesAduana shows the error of a failed request", async () => {
      postMock.mockRejectedValue("down");
      const aduana = instructivo();

      await aduana.GuardaCostosFinalesAduana();

      expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", title: "Ocurrió un error", text: "down", showConfirmButton: true });
    });
  });
});

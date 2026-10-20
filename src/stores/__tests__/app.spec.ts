import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useAppStore } from "@/stores/app";
import { useEntitiesStore } from "@/stores/entities";
import { useHousesStore } from "@/stores/houses";
import { useMastersStore } from "@/stores/masters";
import type { ExpedienteSinSolicitud } from "@/types/requests";
import type { FiltroControlGastosRaiz, ListaPagosRaiz, TipoEmbarqueRaiz } from "@/types/app";
import type { MasterListadoControlGasto } from "@/types/billing";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), go: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const lastConfig = () => httpMock.mock.lastCall![0];
const embarque = (id: number): TipoEmbarqueRaiz => ({ id, code: "FCL", id_transport: 1 });
const emptyFilter = () => ({
  fecha_etd_desde: null,
  fecha_eta_desde: null,
  fecha_etd_hasta: null,
  fecha_eta_hasta: null,
});

describe("app store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id: 21, id_branch: 7, id_user: 33 }]));
    sessionStorage.setItem("idMenu", "5");
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("_getGroupList keeps the first row of each group and posts the user, module and branch", async () => {
    respond({
      getGroupList: accepted([
        { namegroup: "A", id: 1 },
        { namegroup: "B", id: 2 },
        { namegroup: "A", id: 3 },
      ]),
    });
    const app = useAppStore();

    app._getGroupList();
    await flushPromises();

    expect(lastConfig()).toEqual({
      method: "post",
      url: URL_MAIN + "getGroupList",
      headers: JSON_HEADERS,
      data: JSON.stringify({ id_entitie: 21, id_module: "5", id_branch: 7 }),
    });
    expect(app.itemsList).toEqual([
      { namegroup: "A", id: 1 },
      { namegroup: "B", id: 2 },
    ]);
  });

  test("_getHouseList posts the master id the masters store holds", async () => {
    respond({ getHouseList: accepted([{ id: 8 }]) });
    const app = useAppStore();
    useMastersStore().master_insertId = 4;

    await app._getHouseList();

    expect(lastConfig()).toEqual({
      method: "post",
      url: URL_MAIN + "getHouseList",
      headers: JSON_HEADERS,
      data: { id_master: 4, id_branch: 7 },
    });
    expect(app.itemsHouseList).toEqual([{ id: 8 }]);
  });

  test("cargarMaster builds the filter URL, numbers the rows and flags the list as loaded", async () => {
    const app = useAppStore();
    let loadedDuringRequest: unknown;
    httpMock.mockImplementation(async () => {
      loadedDuringRequest = app.dataMaster;
      return { data: accepted([{ id: 1 }, { id: 2 }]) };
    });
    app.dataMaster = true;
    const filtro = { idsentido: 2, idtipocarga: 3, idincoterms: 4, idorigen: 5 };

    await app.cargarMaster(filtro);

    expect(lastConfig()).toEqual({
      method: "get",
      url:
        URL_MAIN +
        "cargar_master?id_branch=7&id_modality=2&id_shipment=3&id_incoterms=4&id_port_begin=5&id_port_end=2\n          \n          ",
      headers: JSON_HEADERS,
      data: filtro,
    });
    expect(loadedDuringRequest).toBe(false);
    expect(app.itemsMasterList).toEqual([
      { id: 1, index: 0 },
      { id: 2, index: 1 },
    ]);
    expect(app.dataMaster).toBe(true);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("cargarMaster empties the list on a rejection and sends a confirmed 401 to Login", async () => {
    vi.useFakeTimers();
    respond({ cargar_master: rejected("Sesión expirada", "401") });
    const app = useAppStore();
    app.itemsMasterList = [{ id: 9 }];

    await app.cargarMaster({});
    await flushPromises();

    expect(lastConfig().url).toBe(
      URL_MAIN +
        "cargar_master?id_branch=7&id_modality=&id_shipment=&id_incoterms=&id_port_begin=&id_port_end=\n          \n          "
    );
    expect(app.itemsMasterList).toEqual([]);
    expect(Swal.fire).toHaveBeenCalledWith({
      icon: "error",
      text: "Sesión expirada",
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
    });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("cargarMaster stays on the screen when a rejection is not a 401", async () => {
    respond({ cargar_master: rejected("Sin datos") });

    await useAppStore().cargarMaster({});
    await flushPromises();

    expect(Swal.fire).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
  });

  test("_getMasterList sends the masters filter with the branch, the type id, the admin status and the page offset", async () => {
    const app = useAppStore();
    useMastersStore().master_filtro = {
      ...emptyFilter(),
      id_canal: 3,
      id_tipo_embarque: embarque(2),
      status_administrativo: 0,
      pagina: 3,
      limite: 20,
    };
    let loadedDuringRequest: unknown;
    httpMock.mockImplementation(async () => {
      loadedDuringRequest = app.dataMaster;
      return { data: accepted([{ id: 5 }]) };
    });
    app.dataMaster = true;

    await app._getMasterList();

    expect(lastConfig()).toEqual({
      method: "get",
      url: URL_MAIN + "getMasterList",
      params: {
        ...emptyFilter(),
        id_canal: 3,
        status_administrativo: 0,
        id_branch: 7,
        id_tipo_embarque: 2,
        status_adm: 0,
        pagina: 40,
        limite: 20,
      },
      headers: JSON_HEADERS,
    });
    expect(loadedDuringRequest).toBe(false);
    expect(app.itemsMasterList).toEqual([{ id: 5 }]);
    expect(app.dataMaster).toBe(true);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("_getMasterList falls back to empty type and status, the first page and no limit", async () => {
    respond({ getMasterList: accepted([]) });
    useMastersStore().master_filtro = {
      ...emptyFilter(),
      id_tipo_embarque: {} as TipoEmbarqueRaiz,
      status_administrativo: 2,
    };

    await useAppStore()._getMasterList();

    expect(lastConfig().params).toEqual({
      ...emptyFilter(),
      status_administrativo: 2,
      id_branch: 7,
      id_tipo_embarque: "",
      status_adm: "",
      pagina: 0,
      limite: -1,
    });
  });

  test("_getMasterList empties the list on a rejection and shows the error only while filtering", async () => {
    respond({ getMasterList: rejected("Sin datos") });
    const app = useAppStore();
    app.itemsMasterList = [{ id: 1 }];

    await app._getMasterList();
    expect(app.itemsMasterList).toEqual([]);
    expect(Swal.fire).not.toHaveBeenCalled();

    useMastersStore().master_filtrarData = true;
    await app._getMasterList();
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "Sin datos" });
  });

  test("_getHouseListAll builds the URL from the houses filter and its defaults", async () => {
    respond({ getHouseListAll: accepted([{ id: 3 }]) });
    const app = useAppStore();
    const houses = useHousesStore();

    await app._getHouseListAll();
    expect(lastConfig().url).toBe(
      URL_MAIN +
        "getHouseListAll?id_branch=7&id_master=&id_sentido=&id_tipo_embarque=&id_origen=&id_destino=&id_cliente=&fecha_etd=&fecha_eta=&pagina=0&limite=-1&orden=code_master DESC&busqueda="
    );

    houses.house_filtro = {
      ...emptyFilter(),
      id_master: 4,
      id_sentido: 1,
      id_tipo_embarque: embarque(2),
      id_origen: 5,
      id_destino: 6,
      id_cliente: 8,
      fecha_etd: "2026-01-01",
      fecha_eta: "2026-02-01",
      pagina: 2,
      limite: 25,
      orden: "nro_hbl ASC",
      busqueda: "abc",
    };
    await app._getHouseListAll();
    expect(lastConfig().url).toBe(
      URL_MAIN +
        "getHouseListAll?id_branch=7&id_master=4&id_sentido=1&id_tipo_embarque=2&id_origen=5&id_destino=6&id_cliente=8&fecha_etd=2026-01-01&fecha_eta=2026-02-01&pagina=25&limite=25&orden=nro_hbl ASC&busqueda=abc"
    );
    expect(app.itemsHouseListAll).toEqual([{ id: 3 }]);
    expect(app.dataHouse).toBe(true);
  });

  test("_getHouseListAll flags the list as loading during the request and shows the error only while filtering", async () => {
    const app = useAppStore();
    let loadedDuringRequest: unknown;
    httpMock.mockImplementation(async () => {
      loadedDuringRequest = app.dataHouse;
      return { data: rejected("Sin houses") };
    });
    app.dataHouse = true;
    app.itemsHouseListAll = [{ id: 1 }] as unknown as ExpedienteSinSolicitud[];

    await app._getHouseListAll();
    expect(loadedDuringRequest).toBe(false);
    expect(app.itemsHouseListAll).toEqual([]);
    expect(Swal.fire).not.toHaveBeenCalled();

    useHousesStore().house_filtrarData = true;
    await app._getHouseListAll();
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "Sin houses" });
  });

  test("_getTotalHouseListAll counts with the houses filter, leaves the list flag down and reads a bad total as zero", async () => {
    const app = useAppStore();
    useHousesStore().house_filtro = { ...emptyFilter(), id_master: 4, id_tipo_embarque: embarque(2) };
    app.dataHouse = true;
    respond({ getTotalHouseListAll: { ...accepted([]), total: "12" } });

    await app._getTotalHouseListAll();

    expect(lastConfig().url).toBe(
      URL_MAIN +
        "getTotalHouseListAll?id_branch=7&id_master=4&id_sentido=&id_tipo_embarque=2&id_origen=&id_destino=&id_cliente=&fecha_etd=&fecha_eta=&busqueda="
    );
    expect(app.totalItemsHouseListAll).toBe(12);
    expect(app.dataHouse).toBe(false);

    respond({ getTotalHouseListAll: { ...accepted([]), total: "x" } });
    await app._getTotalHouseListAll();
    expect(app.totalItemsHouseListAll).toBe(0);
  });

  test("_getHouseServices sends the house id in a GET body and empties the services when the request fails", async () => {
    const app = useAppStore();
    app.house_Id_get = 31;
    respond({ getHouseListAll: accepted([{ id: 1 }]) });

    await app._getHouseServices();
    expect(lastConfig()).toEqual({
      method: "get",
      url: URL_MAIN + "getHouseListAll",
      headers: JSON_HEADERS,
      data: { id: 31, id_branch: 7 },
    });
    expect(app.itemsHouseServices).toEqual([{ id: 1 }]);

    respond({ getHouseListAll: new Error("network") });
    await app._getHouseServices();
    expect(app.itemsHouseServices).toEqual([]);
  });

  test("_getBegEndList posts the house id", async () => {
    const app = useAppStore();
    app.house_Id_get = 31;
    respond({ getBegEndList: accepted([{ id: 2 }]) });

    await app._getBegEndList();

    expect(lastConfig()).toEqual({
      method: "post",
      url: URL_MAIN + "getBegEndList",
      headers: JSON_HEADERS,
      data: { id: 31, id_branch: 7 },
    });
    expect(app.itemsBegEndList).toEqual([{ id: 2 }]);
  });

  test("_getControlFileAllFilter posts the report filters and closes the table spinner and the dialog", async () => {
    const app = useAppStore();
    Object.assign(app, {
      report_id_sentido: 1,
      report_id_operador: 2,
      report_id_status: 3,
      report_id_status_adm: 4,
      reportFecha_ini: "2026-01-01",
      reportFecha_fin: "2026-01-31",
      reportStatusTable: false,
      reportsDialog: true,
    });
    let tableDuringRequest: unknown;
    httpMock.mockImplementation(async () => {
      tableDuringRequest = app.reportStatusTable;
      return { data: accepted([{ id: 6 }]) };
    });

    await app._getControlFileAllFilter();

    expect(lastConfig()).toEqual({
      method: "post",
      url: URL_MAIN + "getControlFileAllFilter",
      headers: JSON_HEADERS,
      data: {
        idsentido: 1,
        idOperador: 2,
        idStatus: 3,
        idStatusAdm: 4,
        fecha_ini: "2026-01-01",
        fecha_fin: "2026-01-31",
      },
    });
    expect(tableDuringRequest).toBe(true);
    expect(app.itemsReportFileAll).toEqual([{ id: 6 }]);
    expect(app.reportStatusTable).toBe(false);
    expect(app.reportsDialog).toBe(false);
  });

  test("_getControlFileAllFilterMaster posts the direction and dates and fills the master report", async () => {
    const app = useAppStore();
    Object.assign(app, {
      report_id_sentido: 1,
      reportFecha_ini: "2026-01-01",
      reportFecha_fin: "2026-01-31",
      reportsDialog: true,
    });
    let tableDuringRequest: unknown;
    httpMock.mockImplementation(async () => {
      tableDuringRequest = app.reportStatusTable;
      return { data: accepted([{ id: 7 }]) };
    });

    await app._getControlFileAllFilterMaster();

    expect(lastConfig()).toEqual({
      method: "post",
      url: URL_MAIN + "getControlFileAllFilterMaster",
      headers: JSON_HEADERS,
      data: { idsentido: 1, fecha_ini: "2026-01-01", fecha_fin: "2026-01-31" },
    });
    expect(tableDuringRequest).toBe(true);
    expect(app.itemsReportFileAllMaster).toEqual([{ id: 7 }]);
    expect(app.reportStatusTable).toBe(false);
    expect(app.reportsDialog).toBe(false);
  });

  test("_getTotales posts the report filters and leaves the table spinner on", async () => {
    const app = useAppStore();
    Object.assign(app, {
      report_id_sentido: 1,
      report_id_operador: 2,
      report_id_status: 3,
      report_id_status_adm: 4,
      reportFecha_ini: "a",
      reportFecha_fin: "b",
      reportStatusTable: false,
    });
    respond({ getTotales: accepted([{ total: 9 }]) });

    await app._getTotales();

    expect(lastConfig()).toEqual({
      method: "post",
      url: URL_MAIN + "getTotales",
      headers: JSON_HEADERS,
      data: { idsentido: 1, idOperador: 2, idStatus: 3, idStatusAdm: 4, fecha_ini: "a", fecha_fin: "b" },
    });
    expect(app.itemsTotalesAll).toEqual([{ total: 9 }]);
    expect(app.reportStatusTable).toBe(true);
  });

  test("_addContacts appends the upper-cased contact to the same list and clears the fields", () => {
    const app = useAppStore();
    const list = app.itemsListContact;
    app.contact_name = "ana";
    app.contact_number = "999";

    app._addContacts();

    expect(app.itemsListContact).toBe(list);
    expect(list).toEqual([{ name: "ANA", number: "999" }]);
    expect([app.contact_name, app.contact_number]).toEqual(["", ""]);
  });

  test("_addPhones appends the phone before saving it and clears the fields after the request", async () => {
    const app = useAppStore();
    app.phone_id = { id: 2, name: "Celular" };
    app.phone_number = "555";
    let duringRequest: unknown;
    httpMock.mockImplementation(async () => {
      duringRequest = [JSON.parse(JSON.stringify(app.itemsListPhone)), app.phone_number];
      return { data: accepted([]) };
    });

    await app._addPhones(12);

    expect(lastConfig()).toEqual({
      method: "post",
      url: URL_MAIN + "guardar_telefono",
      headers: JSON_HEADERS,
      data: { id: 12, tipo: 2, phone: "555" },
    });
    expect(duringRequest).toEqual([[{ id: 2, name: "Celular", number: "555" }], "555"]);
    expect([app.phone_id, app.phone_number]).toEqual(["", ""]);
  });

  test("ListarPhones empties the phones before the request and maps the answer", async () => {
    const app = useAppStore();
    app.itemsListPhone = [{ id: 1, name: "Old", number: "1" }];
    let duringRequest: unknown;
    httpMock.mockImplementation(async () => {
      duringRequest = JSON.parse(JSON.stringify(app.itemsListPhone));
      return { data: accepted([{ id: 4, name: "Oficina", phone_number: "123" }]) };
    });

    await app.ListarPhones(5);

    expect(lastConfig()).toEqual({ method: "get", url: URL_MAIN + "listar_phone/5", headers: JSON_HEADERS });
    expect(duringRequest).toEqual([]);
    expect(app.itemsListPhone).toEqual([{ id: 4, name: "Oficina", number: "123" }]);
  });

  test("_deletePhones alerts an object and removes the first phone", () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const app = useAppStore();
    app.itemsListPhone = [
      { id: 1, name: "A", number: "1" },
      { id: 2, name: "B", number: "2" },
    ];

    app._deletePhones();

    expect(alert).toHaveBeenCalledTimes(1);
    expect(String(alert.mock.calls[0]![0])).toBe("[object Object]");
    expect(app.itemsListPhone).toEqual([{ id: 2, name: "B", number: "2" }]);
  });

  test("_deleteContacts alerts an object and removes the first contact", () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const app = useAppStore();
    app.itemsListContact = [
      { name: "A", number: "1" },
      { name: "B", number: "2" },
    ];

    app._deleteContacts();

    expect(String(alert.mock.calls[0]![0])).toBe("[object Object]");
    expect(app.itemsListContact).toEqual([{ name: "B", number: "2" }]);
  });

  test("_getPhone and _getContacts load the entity the entities store selected", async () => {
    const app = useAppStore();
    useEntitiesStore().id_entitie_selected = 44;
    respond({ "getPhone/44": accepted([{ id: 1 }]), "getContacts/44": accepted([{ id: 2 }]) });

    await app._getPhone();
    expect(lastConfig()).toEqual({
      method: "post",
      url: URL_MAIN + "getPhone/44",
      headers: JSON_HEADERS,
      data: { id_branch: 7 },
    });
    await app._getContacts();
    expect(lastConfig()).toEqual({
      method: "post",
      url: URL_MAIN + "getContacts/44",
      headers: JSON_HEADERS,
      data: { id_branch: 7 },
    });

    expect(app.itemsListPhoneEdit).toEqual([{ id: 1 }]);
    expect(app.itemsListContactEdit).toEqual([{ id: 2 }]);
  });

  test("_setControl sends a null user when none is set, keeps the first row's numbers and toggles the drawer", async () => {
    const app = useAppStore();
    Object.assign(app, { dataControl_id_house: 3, dataControl_id_user: "", dataControl_status: 1, drawer: false });
    const rows = [{ nrocontrol: "C-1", idcontrol: 9, idorders: 10 }];
    respond({ setControl: accepted(rows) });

    await app._setControl();
    expect(lastConfig()).toEqual({
      method: "post",
      url: URL_MAIN + "setControl",
      headers: JSON_HEADERS,
      data: { id_house: 3, id_user: null, status: 1 },
    });
    expect([app.dataControl_Numero, app.dataControl_idControl, app.dataControl_id_orders]).toEqual(["C-1", 9, 10]);
    expect(app.itemsDataControl).toEqual(rows);
    expect(app.drawer).toBe(true);

    app.dataControl_id_user = 6;
    await app._setControl();
    expect(lastConfig().data).toEqual({ id_house: 3, id_user: 6, status: 1 });
    expect(app.drawer).toBe(false);
  });

  test("_setIngresos posts the income fields of the order", async () => {
    const app = useAppStore();
    Object.assign(app, {
      dataControl_id_orders: 10,
      dataIngreso_concepto: "Flete",
      dataIngreso_montoop: 100,
      dataIngreso_igvop: 18,
      dataIngreso_totalop: 118,
      dataControl_id_user: 6,
    });
    respond({ setIngresos: accepted([{ id: 1 }]) });

    await app._setIngresos();

    expect(lastConfig()).toEqual({
      method: "post",
      url: URL_MAIN + "setIngresos",
      headers: JSON_HEADERS,
      data: { id_orders: 10, concepto: "Flete", monto_op: 100, igv_op: 18, total_op: 118, id_user: 6 },
    });
    expect(app.itemsDataIngresos).toEqual([{ id: 1 }]);
  });

  test("_getIngresos loads the order's income and rejects with a ReferenceError when the request fails", async () => {
    const app = useAppStore();
    app.dataControl_id_orders = 10;
    respond({ "getIngresos/10": accepted([{ id: 1 }]) });

    await app._getIngresos();
    expect(lastConfig()).toEqual({ method: "post", url: URL_MAIN + "getIngresos/10", headers: JSON_HEADERS });
    expect(app.itemsDataIngresosList).toEqual([{ id: 1 }]);

    respond({ "getIngresos/10": new Error("network") });
    await expect(app._getIngresos()).rejects.toThrow(ReferenceError);
  });

  test("_getTotalesProveedor loads the supplier totals of the order", async () => {
    const app = useAppStore();
    app.dataControl_id_orders = 10;
    respond({ "getTotalesProveedor/10": accepted([{ total: 1 }]) });

    await app._getTotalesProveedor();

    expect(lastConfig()).toEqual({ method: "post", url: URL_MAIN + "getTotalesProveedor/10", headers: JSON_HEADERS });
    expect(app.itemsDataTotalesProveedor).toEqual([{ total: 1 }]);
  });

  test("_getControlList sends the expense filter with the branch and flags the list as loading during the request", async () => {
    const app = useAppStore();
    app.controlgastosfiltro = { id_canal: 2 } as FiltroControlGastosRaiz;
    app.dataGastos = true;
    let loadedDuringRequest: unknown;
    httpMock.mockImplementation(async () => {
      loadedDuringRequest = app.dataGastos;
      return { data: accepted([{ id: 1 }]) };
    });

    await app._getControlList();

    expect(lastConfig()).toEqual({
      method: "get",
      url: URL_MAIN + "getControlList",
      headers: JSON_HEADERS,
      params: { id_canal: 2, id_branch: 7 },
    });
    expect(loadedDuringRequest).toBe(false);
    expect(app.itemsDataControlList).toEqual([{ id: 1 }]);
    expect(app.dataGastos).toBe(true);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("_getControlList empties the list on a rejection and sends a confirmed 401 to Login", async () => {
    vi.useFakeTimers();
    respond({ getControlList: { ...rejected("Sesión expirada", "401"), statusText: "Unauthorized" } });
    const app = useAppStore();
    app.itemsDataControlList = [{ id: 1 }] as MasterListadoControlGasto[];

    await app._getControlList();
    await flushPromises();

    expect(app.itemsDataControlList).toEqual([]);
    expect(Swal.fire).toHaveBeenCalledWith({
      icon: "error",
      title: "Unauthorized",
      text: "Sesión expirada",
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
    });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("_getListaPagosXProveedorCxC empties the list first, then numbers the rows and defaults rate and currency to 1", async () => {
    const app = useAppStore();
    app.listPagosXProveedorCxP = [{ id: 1 }] as unknown as ListaPagosRaiz;
    let duringRequest: unknown;
    const rows = [{ a: 1 }, { tipocambio: 3.5, id_coins: 2 }, { tipocambio: 0, id_coins: null }];
    httpMock.mockImplementation(async () => {
      duringRequest = JSON.parse(JSON.stringify(app.listPagosXProveedorCxP));
      return { data: { statusBol: true, data: rows } };
    });

    await app._getListaPagosXProveedorCxC(15);

    expect(lastConfig()).toEqual({
      method: "get",
      url: URL_MAIN + "getListaPagosXProveedorCxC/15",
      headers: JSON_HEADERS,
    });
    expect(duringRequest).toEqual([]);
    expect(app.listPagosXProveedorCxP).toEqual([
      { a: 1, index: 0, tipocambio: 1, id_coins: 1 },
      { tipocambio: 3.5, id_coins: 2, index: 1 },
      { tipocambio: 0, id_coins: 1, index: 2 },
    ]);
  });

  test("_getListaPagosXProveedorCxC warns and leaves the list empty when the answer is not ok", async () => {
    const app = useAppStore();
    app.listPagosXProveedorCxP = [{ id: 1 }] as unknown as ListaPagosRaiz;
    respond({ "getListaPagosXProveedorCxC/15": { statusBol: false, mensaje: "Sin pagos" } });

    await app._getListaPagosXProveedorCxC(15);

    expect(app.listPagosXProveedorCxP).toEqual([]);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "warning", title: "Advertencia", text: "Sin pagos" });
  });

  test("_setPortBegin and _setPortEnd drop repeated ports", () => {
    const app = useAppStore();
    const ports = [
      { id_port: 1, name: "A" },
      { id_port: 2, name: "B" },
      { id_port: 1, name: "A again" },
    ];

    app._setPortBegin(ports);
    app._setPortEnd(ports);

    expect(app.itemsPortBegin).toEqual([
      { id_port: 1, name: "A" },
      { id_port: 2, name: "B" },
    ]);
    expect(app.itemsPortEnd).toEqual(app.itemsPortBegin);
  });

  test("_setItemsDataRoleList parses the role ids", () => {
    const app = useAppStore();

    app._setItemsDataRoleList([{ id: "11", code: 1, name: "CLIENTE" }]);
    expect(app.itemsDataRoleList).toEqual([{ id: 11, code: 1, name: "CLIENTE" }]);

    app._setItemsDataRoleList([]);
    expect(app.itemsDataRoleList).toEqual([]);
  });

  test("isEmpresaPermitida accepts only the branches 1 and 2 of the stored dataBranch", () => {
    const permitted = (dataBranch?: string) => {
      localStorage.clear();
      if (dataBranch !== undefined) localStorage.setItem("dataBranch", dataBranch);
      setActivePinia(createPinia());
      return useAppStore().isEmpresaPermitida;
    };

    expect(permitted()).toBe(false);
    expect(permitted(JSON.stringify([{ id: 2 }]))).toBe(true);
    expect(permitted(JSON.stringify([{ id: 7 }]))).toBe(false);
    expect(permitted(JSON.stringify([]))).toBeUndefined();
    expect(permitted("{bad")).toBe(false);
    expect(console.error).toHaveBeenCalledWith("Error al parsear dataBranch", expect.any(SyntaxError));
  });

  test("isEmpresaPermitida keeps its first answer for the life of the store", () => {
    const app = useAppStore();
    expect(app.isEmpresaPermitida).toBe(false);

    localStorage.setItem("dataBranch", JSON.stringify([{ id: 1 }]));

    expect(app.isEmpresaPermitida).toBe(false);
  });

  test("the getters that read another key return that key", () => {
    const app = useAppStore();
    Object.assign(app, {
      itemsEntities: [{ id: 1 }],
      itemsContainers: [{ id: 2 }],
      itemsDocumentsPais: [{ id: 3 }],
      itemsMenu: [{ id: 4 }],
      InvoiceAdmin: [{ id: 5 }],
      master_id_trasnport: { id: 6 },
    });

    expect(app.itemsEntitie).toEqual([{ id: 1 }]);
    expect(app.itemsConsigner).toEqual([{ id: 2 }]);
    expect(app.itemsDocument).toEqual([{ id: 3 }]);
    expect(app.itemsListGetter).toEqual([{ id: 4 }]);
    expect([app.InvoiceAdminGetter, app.monthGetter, app.yearGetter]).toEqual([[{ id: 5 }], [{ id: 5 }], [{ id: 5 }]]);
    expect(app.master_embarqueGetter).toBe(6);
  });
});

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const row = { id: 1, valorcodigo: "01", description: "IGV" };

const lists = [
  { action: "GetListImpuestos", path: "listar_master_detalle_impuesto", key: "lstImpuesto" },
  { action: "GetListNotasCotizacion", path: "listar_master_detalle_notas_cotizacion", key: "lstNotasQuote" },
  { action: "GetListTipoTelefono", path: "listar_master_detalle_tipotelefono", key: "lstTipoTelefono" },
] as const;

const loaders = [
  { action: "cargarMasterDetalleCanal", method: "post", path: "cargar_master_detalle_canal?id_branch=7", key: "lstCanales" },
  { action: "cargarMasterDetalleTipoProveedor", method: "post", path: "cargar_master_detalle_tipo_proveedor?id_branch=7", key: "lstTipoProveedor" },
  { action: "cargarMasterDetallePercepcionAduana", method: "get", path: "cargar_master_detalle_percepcion_aduana?id_branch=7", key: "lstPercepcionAduana" },
  { action: "cargarMasterDetalleTipoTransaccion", method: "get", path: "cargar_master_detalle_tipo_percepcion?id_branch=7", key: "lstTipoTransaccion" },
  { action: "cargarTipoTelefono", method: "get", path: "cargar_master_detalle_tipo_telefono?id_branch=7", key: "lstTipoTelefono" },
  { action: "cargarTipoPersona", method: "get", path: "cargar_master_detalle_tipo_persona?id_branch=7", key: "lstTipoPersona" },
  { action: "cargarImpuestoRenta", method: "get", path: "cargar_master_detalle_impuesto_renta?id_branch=7", key: "lstImpRenta" },
  { action: "cargarTemperaturaLeds", method: "get", path: "cargar_master_detalle_temperatura_leads", key: "lstTemperatura" },
] as const;

describe("masterusuarios store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  test.each(lists)("$action reads the current filters and keeps the rows", async ({ action, path, key }) => {
    respond({ [path]: accepted([row]) });
    const store = useMasterusuariosStore();

    await store[action]();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + `${path}?&id_branch=7&id_master=&valorcodigo=&codigo01=&codigo02=&description=&status=true&escomunflag=false`,
      headers: JSON_HEADERS,
    });
    expect(store[key]).toEqual([row]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test.each(lists)("$action empties its list and tells the user when the backend rejects", async ({ action, path, key }) => {
    respond({ [path]: rejected() });
    const store = useMasterusuariosStore();
    store[key] = [row];

    await store[action]();

    expect(store[key]).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("the list actions send an empty or cleared filter as the text the backend expects", async () => {
    respond({
      listar_master_detalle_impuesto: accepted([]),
      listar_master_detalle_notas_cotizacion: accepted([]),
      listar_master_detalle_tipotelefono: accepted([]),
    });
    const store = useMasterusuariosStore();
    store.filtros = { ...store.filtros, id_master: 3, valorcodigo: null, codigo01: null, codigo02: null, description: null, status: null, escomunflag: true };

    await store.GetListImpuestos();
    await store.GetListNotasCotizacion();
    await store.GetListTipoTelefono();

    expect(httpMock.mock.calls.map(([config]) => config.url.slice(URL_MAIN.length))).toEqual([
      "listar_master_detalle_impuesto?&id_branch=7&id_master=3&valorcodigo=&codigo01=&codigo02=null&description=&status=null&escomunflag=true",
      "listar_master_detalle_notas_cotizacion?&id_branch=7&id_master=3&valorcodigo=&codigo01=null&codigo02=&description=&status=&escomunflag=true",
      "listar_master_detalle_tipotelefono?&id_branch=7&id_master=3&valorcodigo=&codigo01=&codigo02=null&description=&status=null&escomunflag=true",
    ]);
  });

  test("a rejected list with a 401 sends the user to the login screen", async () => {
    vi.useFakeTimers();
    const reload = vi.fn();
    vi.stubGlobal("location", { reload });
    const { default: router } = await import("@/router");
    respond({ listar_master_detalle_impuesto: rejected("Sesión vencida", "401") });
    const store = useMasterusuariosStore();

    await store.GetListImpuestos();
    await flushPromises();
    vi.runAllTimers();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Sesión vencida" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
    expect(reload).toHaveBeenCalled();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test("lstTemperatura stays undefined until its loader answers", () => {
    expect(useMasterusuariosStore().lstTemperatura).toBeUndefined();
  });

  test.each(loaders)("$action fills $key with the rows, or with an empty list when the backend rejects", async ({ action, method, path, key }) => {
    respond({ [path.split("?")[0]!]: accepted([row]) });
    const store = useMasterusuariosStore();

    await store[action]();
    await flushPromises();

    expect(httpMock).toHaveBeenCalledWith({ method, url: URL_MAIN + path, headers: JSON_HEADERS });
    expect(store[key]).toEqual([row]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");

    respond({ [path.split("?")[0]!]: rejected() });
    await store[action]();
    await flushPromises();
    expect(store[key]).toEqual([]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("the telephone type list screen and its loader fill the same list", async () => {
    respond({ listar_master_detalle_tipotelefono: accepted([row]), cargar_master_detalle_tipo_telefono: accepted([{ id: 2 }]) });
    const store = useMasterusuariosStore();

    await store.GetListTipoTelefono();
    expect(store.lstTipoTelefono).toEqual([row]);
    await store.cargarTipoTelefono();
    await flushPromises();
    expect(store.lstTipoTelefono).toEqual([{ id: 2 }]);
  });

  test("ActualizarMasterDetalle and the two register actions send the model and show the answer", async () => {
    respond({
      actualizar_master_detalle: accepted([]),
      insertar_master_detalle_tipotelefono: rejected("Duplicado"),
      insertar_master_detalle_notas_cotizacion: accepted([]),
    });
    const store = useMasterusuariosStore();
    store.model = { ...store.model, valorcodigo: "07", description: "Nota" };

    await store.ActualizarMasterDetalle();
    await store.RegistrarMasterDetalleTipoTelefono();
    await store.RegistrarMasterDetalleNotasCotizacion();

    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "put", url: URL_MAIN + "actualizar_master_detalle", headers: JSON_HEADERS, data: store.model });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "post", url: URL_MAIN + "insertar_master_detalle_tipotelefono", headers: JSON_HEADERS, data: store.model });
    expect(httpMock).toHaveBeenNthCalledWith(3, { method: "post", url: URL_MAIN + "insertar_master_detalle_notas_cotizacion", headers: JSON_HEADERS, data: store.model });
    expect(Swal.fire).toHaveBeenNthCalledWith(1, { icon: "success", text: "ok" });
    expect(Swal.fire).toHaveBeenNthCalledWith(2, { icon: "error", text: "Duplicado" });
    expect(Swal.fire).toHaveBeenNthCalledWith(3, { icon: "success", text: "ok" });
  });
});

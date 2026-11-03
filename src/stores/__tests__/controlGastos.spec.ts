import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useControlGastosStore } from "@/stores/controlGastos";
import { useSecuritysStore } from "@/stores/securitys";
import { URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: { id_branch: 7 } } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const control = (data: unknown, extra: Record<string, unknown> = {}) => ({ ...accepted(data), statusBol: true, ...extra });
const controlRejected = (extra: Record<string, unknown> = {}) => ({
  ...rejected("Sin permiso"),
  statusBol: false,
  statusText: "Error",
  ...extra,
});

describe("controlGastos store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("getListControlGastos keeps the rows of the master", async () => {
    respond({ control_gastos_list: accepted([{ master_id: 1 }]) });
    const store = useControlGastosStore();

    await store.getListControlGastos(55);

    expect(httpMock.mock.calls[0]![0].url).toBe(URL_MAIN + "control_gastos_list?id=55");
    expect(store.listControlGastos).toEqual([{ master_id: 1 }]);
  });

  test("getListControlGastos empties the list and says why when the master cannot be read", async () => {
    respond({ control_gastos_list: { ...rejected("Tu sesión no es válida. Vuelve a iniciar sesión."), tipomensaje: "TMSGADV" } });
    const store = useControlGastosStore();
    store.listControlGastos = [{ master_id: 9 }];

    await store.getListControlGastos(55);

    expect(store.listControlGastos).toEqual([]);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "warning", text: "Tu sesión no es válida. Vuelve a iniciar sesión." });
  });

  test("getListControlGastosHouses and Master keep the lsthouses of the first row", async () => {
    respond({
      control_gastos_listhouses: accepted([{ lsthouses: [{ id: 1 }] }]),
      control_gastos_listmaster: accepted([{ lsthouses: [{ id: 2 }] }]),
    });
    const store = useControlGastosStore();

    await store.getListControlGastosHouses(5);
    await store.getListControlGastosMaster(5);

    expect(httpMock.mock.calls.map(([config]) => config.url)).toEqual([
      URL_MAIN + "control_gastos_listhouses?id=5",
      URL_MAIN + "control_gastos_listmaster?id=5",
    ]);
    expect(store.master_houses).toEqual([{ id: 1 }]);
    expect(store.master_egresos).toEqual([{ id: 2 }]);
  });

  test("getListControlGastosHouses and Master leave empty lists, quietly when there is nothing to show", async () => {
    respond({ control_gastos_listhouses: rejected(), control_gastos_listmaster: rejected() });
    const store = useControlGastosStore();
    store.master_houses = [{ id: 1 }];
    store.master_egresos = [{ id: 2 }];

    await store.getListControlGastosHouses(5);
    await store.getListControlGastosMaster(5);

    expect(store.master_houses).toEqual([]);
    expect(store.master_egresos).toEqual([]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("getListControlGastosHouses tells the user to check the connection when there is no answer", async () => {
    httpMock.mockRejectedValueOnce(new Error("network"));
    const store = useControlGastosStore();

    await store.getListControlGastosHouses(5);

    expect(store.master_houses).toEqual([]);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: CONNECTION_ERROR_MESSAGE });
  });

  test("cargarCorrelativo keeps the rows and empties them when statusBol is false", async () => {
    respond({ cargar_correlativo: control([{ id: 1 }]) });
    const store = useControlGastosStore();

    await store.cargarCorrelativo();
    expect(store.listCorrelativo).toEqual([{ id: 1 }]);

    respond({ cargar_correlativo: controlRejected() });
    await store.cargarCorrelativo();
    expect(store.listCorrelativo).toEqual([]);
  });

  test("listarCGECcorralativo numbers the rows from zero", async () => {
    respond({ listar_cge_corralativo: control([{ id: 7 }, { id: 8 }]) });
    const store = useControlGastosStore();

    await store.listarCGECcorralativo(3);

    expect(httpMock.mock.calls[0]![0].url).toBe(URL_MAIN + "listar_cge_corralativo?id_proveedor=3");
    expect(store.listCorrelativo).toEqual([
      { id: 7, index: 0 },
      { id: 8, index: 1 },
    ]);
  });

  test("setControl asks for the control of the house, not of its master", async () => {
    respond({ setControl: accepted([{ idcontrol: 3 }]) });

    expect(await useControlGastosStore().setControl({ id_house: 40, id_master: 12 })).toBe(true);

    expect(httpMock.mock.calls[0]![0]).toMatchObject({ data: { id_house: 40, status: 1 } });
  });

  test("guardarIngresos reloads the houses of the master after a good answer", async () => {
    respond({
      setIngresos: { ...accepted([]), mensaje: "Concepto agregado." },
      control_gastos_listhouses: accepted([{ lsthouses: [{ id: 1 }] }]),
    });
    const store = useControlGastosStore();

    expect(await store.guardarIngresos({ id_master: 21 })).toBe(true);
    await flushPromises();

    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "Concepto agregado." });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + "control_gastos_listhouses?id=21");
    expect(store.master_houses).toEqual([{ id: 1 }]);
  });

  test.each([
    ["guardarIngresos", "setIngresos", { id_master: 1 }],
    ["actualizarIngresos", "editIngreso", { code_master: 1 }],
    ["copiarCGingresos", "copiar_cgingresos", {}],
    ["copiarCGEgresos", "copiar_cgegresos", {}],
    ["setControl", "setControl", { id_house: 1 }],
    ["eliminarIngreso", "delIngresos/9", { id: 9 }],
  ] as const)("%s says why the database refused and reports the failure", async (name, path, body) => {
    respond({ [path]: { ...rejected("No puedes eliminar este concepto porque ya está facturado."), tipomensaje: "TMSGADV" } });

    expect(await useControlGastosStore()[name](body as never)).toBe(false);

    expect(Swal.fire).toHaveBeenCalledWith({ icon: "warning", text: "No puedes eliminar este concepto porque ya está facturado." });
  });

  test("getNombreCompania returns the campaign name, or an empty text when rejected", async () => {
    respond({ obtener_nombre_camapania: accepted([{ name: "Campaña X" }]) });
    const store = useControlGastosStore();

    expect(await store.getNombreCompania(4)).toBe("Campaña X");
    expect(httpMock.mock.calls[0]![0].url).toBe(URL_MAIN + "obtener_nombre_camapania?id_master=4");

    respond({ obtener_nombre_camapania: rejected() });
    expect(await store.getNombreCompania(4)).toBe("");
  });

  test("eliminarIngreso stays quiet when the concept is deleted", async () => {
    respond({ "delIngresos/9": accepted([]) });

    expect(await useControlGastosStore().eliminarIngreso({ id: 9 })).toBe(true);

    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("eliminarIngreso sends the administrator's credentials as autorizacion", async () => {
    respond({ "delIngresos/9": accepted([]) });
    const admin = { usuario: "admin", clave: "secreta" };

    expect(await useControlGastosStore().eliminarIngreso({ id: 9 }, admin)).toBe(true);

    expect(httpMock.mock.calls[0]![0]).toMatchObject({ method: "post", url: URL_MAIN + "delIngresos/9", data: { autorizacion: admin } });
  });

  test("CargaMasivaControlDeGastos hands the answer to its own response and then to securitys, and returns it", async () => {
    respond({ carga_masiva_controldegasto: accepted([{ id_master: 3 }]) });
    const store = useControlGastosStore();
    const securitys = useSecuritysStore();
    store.response = [{ id_master: 1 }] as never;
    const seen: unknown[] = [];
    httpMock.mockImplementationOnce(async () => {
      seen.push(store.response);
      return { data: accepted([{ id_master: 3 }]) };
    });

    const result = await store.CargaMasivaControlDeGastos({ rows: [] });

    expect(seen).toEqual([[]]);
    expect(store.response).toEqual([{ id_master: 3 }]);
    expect(securitys.response).toEqual([{ id_master: 3 }]);
    expect(result).toEqual([{ id_master: 3 }]);
  });

  test("CargaMasivaControlDeGastos says why a load was refused and returns no rows", async () => {
    respond({ carga_masiva_controldegasto: { ...rejected("No se encontraron registros"), tipomensaje: "TMSGADV" } });

    expect(await useControlGastosStore().CargaMasivaControlDeGastos({ rows: [] })).toEqual([]);

    expect(Swal.fire).toHaveBeenCalledWith({ icon: "warning", text: "No se encontraron registros" });
  });

  test("CargaMasivaControlDeGastos tells the user to check the connection when there is no answer", async () => {
    httpMock.mockRejectedValueOnce(new Error("network"));

    expect(await useControlGastosStore().CargaMasivaControlDeGastos({ rows: [] })).toEqual([]);

    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: CONNECTION_ERROR_MESSAGE });
  });

  test("DescargarConsolidadoCargaMasiva shows the server's answer instead of saving a refused workbook", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const mensaje = "Este máster aún no tiene ingresos registrados para consolidar.";
    httpMock.mockResolvedValueOnce({
      data: new Blob([JSON.stringify({ estadoflag: false, mensaje, tipomensaje: "TMSGINF" })], { type: "application/json" }),
    });

    await useControlGastosStore().DescargarConsolidadoCargaMasiva(3);

    expect(Swal.fire).toHaveBeenLastCalledWith({ icon: "info", text: mensaje });
    expect(click).not.toHaveBeenCalled();
    expect(httpMock.mock.calls[0]![0]).toMatchObject({ params: { id_mastercontrol: 3 } });
  });

  test("DescargarConsolidadoCargaMasiva and guardarCuotasCgeTipoProveedor clear the response before the request", async () => {
    const store = useControlGastosStore();
    store.response = [{ id_master: 1 }] as never;
    httpMock.mockRejectedValueOnce(new Error("network"));

    await store.DescargarConsolidadoCargaMasiva(3);
    expect(store.response).toEqual([]);

    store.response = [{ id_master: 1 }] as never;
    respond({ guardar_cuotas_cge_tipo_proveedor: { ...accepted([]), mensaje: "Cuotas guardadas." } });
    expect(await store.guardarCuotasCgeTipoProveedor({})).toEqual([]);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "Cuotas guardadas." });
  });
});

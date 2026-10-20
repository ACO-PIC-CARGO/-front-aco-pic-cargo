import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useControlGastosStore } from "@/stores/controlGastos";
import { useSecuritysStore } from "@/stores/securitys";
import { URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

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

  test("getListControlGastos asks with the route branch and keeps the rows", async () => {
    respond({ control_gastos_list: control([{ master_id: 1 }]) });
    const store = useControlGastosStore();

    await store.getListControlGastos(55);

    expect(httpMock.mock.calls[0]![0].url).toBe(URL_MAIN + "control_gastos_list?id=55&id_branch=7");
    expect(store.listControlGastos).toEqual([{ master_id: 1 }]);
  });

  test("getListControlGastos empties the list, shows the error and goes to Login on a 401", async () => {
    vi.useFakeTimers();
    respond({ control_gastos_list: controlRejected({ status: "401" }) });
    const store = useControlGastosStore();
    store.listControlGastos = [{ master_id: 9 }];

    await store.getListControlGastos(55);
    await flushPromises();

    expect(store.listControlGastos).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", title: "Error", text: "Sin permiso" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("getListControlGastosHouses and Master keep the lsthouses of the answer", async () => {
    respond({
      control_gastos_listhouses: control({ lsthouses: [{ id: 1 }] }),
      control_gastos_listmaster: control({ lsthouses: [{ id: 2 }] }),
    });
    const store = useControlGastosStore();

    await store.getListControlGastosHouses(5);
    await store.getListControlGastosMaster(5);

    expect(store.master_houses).toEqual([{ id: 1 }]);
    expect(store.master_egresos).toEqual([{ id: 2 }]);
  });

  test("getListControlGastosHouses and Master leave the lists undefined when the backend rejects", async () => {
    respond({ control_gastos_listhouses: controlRejected(), control_gastos_listmaster: controlRejected() });
    const store = useControlGastosStore();
    store.master_houses = [{ id: 1 }];
    store.master_egresos = [{ id: 2 }];

    await store.getListControlGastosHouses(5);
    await store.getListControlGastosMaster(5);

    expect(store.master_houses).toBeUndefined();
    expect(store.master_egresos).toBeUndefined();
    expect(Swal.fire).toHaveBeenCalledTimes(2);
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

  test("setControl posts the master with the session user and shows the message", async () => {
    respond({ setControl: control([{ mensaje: "Control activado" }]) });

    await useControlGastosStore().setControl({ id_master: 12 });

    expect(httpMock.mock.calls[0]![0]).toMatchObject({ data: { id_house: 12, id_user: 4, status: 1 } });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "info", text: "Control activado" });
  });

  test("guardarIngresos reloads the houses of the master after a good answer", async () => {
    respond({
      setIngresos: control([{ mensaje: "Guardado" }]),
      control_gastos_listhouses: control({ lsthouses: [{ id: 1 }] }),
    });
    const store = useControlGastosStore();

    await store.guardarIngresos({ id_master: 21 });
    await flushPromises();

    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + "control_gastos_listhouses?id=21&id_branch=7");
    expect(store.master_houses).toEqual([{ id: 1 }]);
  });

  test("actualizarIngresos reloads the houses with the master code", async () => {
    respond({
      editIngreso: control([{ mensaje: "Actualizado" }]),
      control_gastos_listhouses: control({ lsthouses: [] }),
    });

    await useControlGastosStore().actualizarIngresos({ code_master: "M-1" });
    await flushPromises();

    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + "control_gastos_listhouses?id=M-1&id_branch=7");
  });

  test.each([
    ["guardarIngresos", "setIngresos", { id_master: 1 }],
    ["copiarCGingresos", "copiar_cgingresos", {}],
    ["copiarCGEgresos", "copiar_cgegresos", {}],
    ["setControl", "setControl", { id_master: 1 }],
  ] as const)("%s shows the backend message as an error when statusBol is false", async (name, path, body) => {
    respond({ [path]: { ...controlRejected(), data: { mensaje: "No permitido" } } });

    await useControlGastosStore()[name](body as never);

    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No permitido" });
  });

  test("getNombreCompania returns the campaign name, or an empty text when rejected", async () => {
    respond({ obtener_nombre_camapania: accepted([{ name: "Campaña X" }]) });
    const store = useControlGastosStore();

    expect(await store.getNombreCompania(4)).toBe("Campaña X");
    expect(httpMock.mock.calls[0]![0].url).toBe(URL_MAIN + "obtener_nombre_camapania?id_master=4");

    respond({ obtener_nombre_camapania: rejected() });
    expect(await store.getNombreCompania(4)).toBe("");
  });

  test("eliminarIngreso warns only when statusBol is false", async () => {
    respond({ "delIngresos/9": control([]) });
    const store = useControlGastosStore();
    await store.eliminarIngreso({ id: 9 });
    expect(Swal.fire).not.toHaveBeenCalled();

    respond({ "delIngresos/9": { ...controlRejected(), data: { mensaje: "No se pudo" } } });
    await store.eliminarIngreso({ id: 9 });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No se pudo" });
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

  test("DescargarConsolidadoCargaMasiva and guardarCuotasCgeTipoProveedor clear the response before the request", async () => {
    const store = useControlGastosStore();
    store.response = [{ id_master: 1 }] as never;
    httpMock.mockRejectedValueOnce(new Error("network"));

    await store.DescargarConsolidadoCargaMasiva(3);
    expect(store.response).toEqual([]);

    store.response = [{ id_master: 1 }] as never;
    respond({ guardar_cuotas_cge_tipo_proveedor: accepted([{ mensaje: "Cuotas guardadas" }]) });
    expect(await store.guardarCuotasCgeTipoProveedor({})).toEqual([]);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "Cuotas guardadas" });
  });
});

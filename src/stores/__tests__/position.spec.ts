import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { usePositionStore } from "@/stores/position";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const row = { id: 5, code: "ADM", name: "Administrador", estado: true };

describe("position store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test("GetListPosition reads the current filters, sends 'Todos' as empty and keeps the rows", async () => {
    respond({ listar_posicion: accepted([row]) });
    const store = usePositionStore();

    await store.GetListPosition();
    store.filtros = { ...store.filtros, code: "AD", name: "Admin", description: "d", estado: "null" };
    await store.GetListPosition();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "get",
      url: URL_MAIN + "listar_posicion?&id_branch=7&code=&name=&description=&estado=true",
      headers: JSON_HEADERS,
    });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + "listar_posicion?&id_branch=7&code=AD&name=Admin&description=d&estado=");
    expect(store.lstPosition).toEqual([row]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("GetListPosition empties the list and sends a 401 to the login screen", async () => {
    vi.useFakeTimers();
    const reload = vi.fn();
    vi.stubGlobal("location", { reload });
    respond({ listar_posicion: rejected("Sesión vencida", "401") });
    const store = usePositionStore();
    store.lstPosition = [row];

    await store.GetListPosition();
    await flushPromises();
    vi.runAllTimers();

    expect(store.lstPosition).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Sesión vencida" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
    expect(reload).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  test("cargarPosition loads the branch positions and never redirects on a rejected answer", async () => {
    respond({ cargar_posicion: accepted([row]) });
    const store = usePositionStore();
    await store.cargarPosition();
    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "cargar_posicion?&id_branch=7", headers: JSON_HEADERS });
    expect(store.lstPosition).toEqual([row]);

    respond({ cargar_posicion: rejected("Sesión vencida", "401") });
    await store.cargarPosition();
    await flushPromises();

    expect(store.lstPosition).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Sesión vencida" });
    expect(router.push).not.toHaveBeenCalled();
  });

  test("verPosition loads the model of the selected id, and leaves it empty when the backend rejects", async () => {
    respond({ ver_posicion: accepted([{ ...row, user_position: [] }]) });
    const store = usePositionStore();
    store.model.id = 5;

    await store.verPosition();

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "ver_posicion?id_branch=7&id=5", headers: JSON_HEADERS });
    expect(store.model).toEqual({ ...row, user_position: [] });

    respond({ ver_posicion: rejected() });
    await store.verPosition();
    expect(store.model).toBeUndefined();
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info" });
  });

  test("cargarUsuarioNoAsignadoPosicion asks for the users outside the model position", async () => {
    respond({ cargar_usuario_no_asignado_posicion: accepted([{ id: 9, users: "ana" }]) });
    const store = usePositionStore();
    store.model.id = 5;

    await store.cargarUsuarioNoAsignadoPosicion();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "cargar_usuario_no_asignado_posicion?id_branch=7&id=5",
      headers: JSON_HEADERS,
    });
    expect(store.lstUsuarioNoAsignado).toEqual([{ id: 9, users: "ana" }]);
  });

  test("setPosition sends only the id and the users, ActualizarEstadoPosition sends the whole model", async () => {
    respond({ insertar_actualizar_posicion: accepted([]), cambiar_estado_posicion: rejected("No permitido") });
    const store = usePositionStore();
    store.model = { id: 5, code: "ADM", user_position: [{ id: 9, users: "ana" }] };

    await store.setPosition();
    await store.ActualizarEstadoPosition();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "put",
      url: URL_MAIN + "insertar_actualizar_posicion",
      headers: JSON_HEADERS,
      data: { id: 5, user_position: [{ id: 9, users: "ana" }] },
    });
    expect(httpMock).toHaveBeenNthCalledWith(2, {
      method: "put",
      url: URL_MAIN + "cambiar_estado_posicion",
      headers: JSON_HEADERS,
      data: store.model,
    });
    expect(Swal.fire).toHaveBeenNthCalledWith(1, { icon: "success", text: "ok" });
    expect(Swal.fire).toHaveBeenNthCalledWith(2, { icon: "error", text: "No permitido" });
  });
});

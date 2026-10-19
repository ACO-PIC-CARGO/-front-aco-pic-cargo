import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useStatushouseStore } from "@/stores/statushouse";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const arrived = {
  id: 1,
  name: "Arribo",
  id_modalidad: 1,
  id_shipment: 2,
  exwflag: true,
  fobflag: false,
  fcaflag: false,
  cfrflag: false,
  cifflag: false,
  ddpflag: false,
  comentarios: [],
  orden: 1,
};

describe("statushouse store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("getListStatusHouse adds the session branch to the filters, marks every row with its comments hidden and keeps the auth token", async () => {
    respond({ listar_status_house: accepted([{ ...arrived }]) });
    sessionStorage.setItem("auth-token", "kept");
    const store = useStatushouseStore();
    const filters = { id_modalidad: 1 };

    await store.getListStatusHouse(filters);

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "listar_status_house",
      params: { id_modalidad: 1, id_branch: 7 },
      headers: JSON_HEADERS,
    });
    expect(filters).toEqual({ id_modalidad: 1, id_branch: 7 });
    expect(store.listStatusHouse).toEqual([{ ...arrived, verComentarios: false }]);
    expect(sessionStorage.getItem("auth-token")).toBe("kept");
  });

  test("getListStatusHouse works without filters", async () => {
    respond({ listar_status_house: accepted([]) });
    const store = useStatushouseStore();

    await store.getListStatusHouse();

    expect(httpMock.mock.calls[0]![0].params).toEqual({ id_branch: 7 });
  });

  test("getListStatusHouse empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_status_house: rejected() });
    const store = useStatushouseStore();
    store.listStatusHouse = [{ ...arrived, verComentarios: false }];

    await store.getListStatusHouse();

    expect(store.listStatusHouse).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("getListStatusHouse sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ listar_status_house: rejected("Token vencido", "401") });
    const store = useStatushouseStore();

    await store.getListStatusHouse();
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("getListStatusHouse keeps the list when the request fails", async () => {
    respond({ listar_status_house: new Error("network") });
    vi.spyOn(console, "log").mockImplementation(() => {});
    const store = useStatushouseStore();
    store.listStatusHouse = [{ ...arrived, verComentarios: true }];

    await store.getListStatusHouse();

    expect(store.listStatusHouse).toEqual([{ ...arrived, verComentarios: true }]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("getObtenerOrdenStatusHouse keeps the first row as the order, or nothing when rejected", async () => {
    respond({ obtener_orden_status_house: accepted([{ orden: 3 }, { orden: 4 }]) });
    const store = useStatushouseStore();

    await store.getObtenerOrdenStatusHouse({ id_modalidad: 1, id_shipment: 2 });

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "obtener_orden_status_house",
      params: { id_modalidad: 1, id_shipment: 2 },
      headers: JSON_HEADERS,
    });
    expect(store.orden).toEqual({ orden: 3 });

    respond({ obtener_orden_status_house: rejected() });
    await store.getObtenerOrdenStatusHouse({ id_modalidad: 1, id_shipment: 2 });

    expect(store.orden).toBeUndefined();
  });

  test("GuardarStatusHouse posts with the session branch, confirms and reloads the list", async () => {
    respond({ guardar_orden_statuscomentarios: accepted([]), listar_status_house: accepted([]) });
    const store = useStatushouseStore();
    const status = { name: "Nuevo" };

    await store.GuardarStatusHouse(status);
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "guardar_orden_statuscomentarios",
      data: { name: "Nuevo", id_branch: 7 },
      headers: JSON_HEADERS,
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok" });
    expect(httpMock.mock.calls[1]![0]).toMatchObject({ url: URL_MAIN + "listar_status_house", params: { id_branch: 7 } });
  });

  test("GuardarStatus, EliminarStatus and EliminarComentario put their payload, confirm and reload the list", async () => {
    respond({ guardar_orden_status: accepted([]), eliminar_status: accepted([]), eliminar_comentario: accepted([]), listar_status_house: accepted([]) });
    const store = useStatushouseStore();
    const rows = [{ ...arrived, orden: 2 }];

    await store.GuardarStatus(rows);
    await store.EliminarStatus({ id: 1 });
    await store.EliminarComentario({ id: 5, descripcion: "Nota" });
    await flushPromises();

    const sent = httpMock.mock.calls.map(([config]) => [config.method, config.url.slice(URL_MAIN.length), config.data]);
    expect(sent).toEqual([
      ["put", "guardar_orden_status", { lstStatus: rows }],
      ["get", "listar_status_house", undefined],
      ["put", "eliminar_status", { id: 1 }],
      ["get", "listar_status_house", undefined],
      ["put", "eliminar_comentario", { id: 5, descripcion: "Nota" }],
      ["get", "listar_status_house", undefined],
    ]);
    expect(Swal.fire).toHaveBeenCalledTimes(3);
  });
});

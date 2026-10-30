import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { usePuertoStore } from "@/stores/puerto";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const callao = { id: 3, id_pais: 1, code: "PECLL", name: "Callao", description: "", id_transporte: 2, status: 1 };

describe("puerto store", () => {
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

  test("GetListPort sends only the filters the user filled, never the text null, and keeps the rows", async () => {
    respond({ listar_puerto: accepted([callao]) });
    const store = usePuertoStore();

    await store.GetListPort();
    store.PortFilter = { ...store.PortFilter, id_pais: null, code: "", name: null, description: "d", id_transporte: 2, status: "null" };
    await store.GetListPort();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "get",
      url: URL_MAIN + "listar_puerto",
      headers: JSON_HEADERS,
      params: { status: "1" },
    });
    expect(httpMock.mock.calls[1]![0].params).toEqual({ description: "d", id_transporte: 2 });
    expect(store.lstPort).toEqual([callao]);
  });

  test("GetListPort empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_puerto: rejected() });
    const store = usePuertoStore();
    store.lstPort = [callao];

    await store.GetListPort();

    expect(store.lstPort).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("GetListPort sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ listar_puerto: rejected("Token vencido", "401") });
    const store = usePuertoStore();

    await store.GetListPort();
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("GetListPort tells the user when the server cannot be reached", async () => {
    respond({ listar_puerto: new Error("network") });
    const store = usePuertoStore();

    await store.GetListPort();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ text: CONNECTION_ERROR_MESSAGE });
  });

  test("setPuerto posts and ActualizarPuerto puts the current model, each showing the answer and telling whether it saved", async () => {
    respond({ insertar_puerto: accepted([]), actualizar_puerto: rejected("Duplicado") });
    const store = usePuertoStore();
    store.PortModel = callao;

    const created = await store.setPuerto();
    const updated = await store.ActualizarPuerto();

    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "post", url: URL_MAIN + "insertar_puerto", headers: JSON_HEADERS, data: callao });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "put", url: URL_MAIN + "actualizar_puerto", headers: JSON_HEADERS, data: callao });
    expect(Swal.fire).toHaveBeenNthCalledWith(1, { icon: "success", text: "ok" });
    expect(Swal.fire).toHaveBeenNthCalledWith(2, { icon: "error", text: "Duplicado" });
    expect([created, updated]).toEqual([true, false]);
  });

  test("verPuerto returns the first row, undefined when empty, null when the request fails", async () => {
    respond({ ver_puerto: accepted([callao, { ...callao, id: 4 }]) });
    const store = usePuertoStore();

    expect(await store.verPuerto({ id: 3 })).toEqual(callao);
    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "ver_puerto", headers: JSON_HEADERS, params: { id: 3 } });

    respond({ ver_puerto: rejected() });
    expect(await store.verPuerto({ id: 9 })).toBeUndefined();

    vi.spyOn(console, "error").mockImplementation(() => {});
    respond({ ver_puerto: new Error("network") });
    expect(await store.verPuerto({ id: 9 })).toBeNull();
  });
});

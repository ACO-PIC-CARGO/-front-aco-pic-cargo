import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useStatesStore } from "@/stores/states";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const loreto = { id: 2, id_pais: 1, code: "LOR", name: "Loreto", description: "", status: 1 };

describe("states store", () => {
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

  test("GetListState sends only the filters the user filled and keeps the rows", async () => {
    respond({ listar_state: accepted([loreto]) });
    const store = useStatesStore();

    await store.GetListState();
    store.StateFilter = { ...store.StateFilter, id_pais: 1, code: "LO", name: null, description: "d", status: "null" };
    await store.GetListState();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "get",
      url: URL_MAIN + "listar_state",
      headers: JSON_HEADERS,
      params: { status: "1" },
    });
    expect(httpMock.mock.calls[1]![0].params).toEqual({ id_pais: 1, code: "LO", description: "d" });
    expect(store.lstState).toEqual([loreto]);
  });

  test("GetListState tells whether the user may edit departments", async () => {
    const store = useStatesStore();

    respond({ listar_state: accepted([{ ...loreto, editableflag: true }]) });
    await store.GetListState();
    const acoAdmin = store.editable;
    respond({ listar_state: accepted([{ ...loreto, editableflag: false }]) });
    await store.GetListState();

    expect(acoAdmin).toBe(true);
    expect(store.editable).toBe(false);
  });

  test("GetListState empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_state: rejected() });
    const store = useStatesStore();
    store.lstState = [loreto];

    await store.GetListState();

    expect(store.lstState).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("GetListState sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ listar_state: rejected("Token vencido", "401") });
    const store = useStatesStore();

    await store.GetListState();
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("GetListState tells the user when the server cannot be reached", async () => {
    respond({ listar_state: new Error("network") });
    const store = useStatesStore();

    await store.GetListState();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ text: CONNECTION_ERROR_MESSAGE });
  });

  test("setState posts and ActualizarState puts the current model, each showing the answer and telling whether it saved", async () => {
    respond({ insertar_state: accepted([]), actualizar_state: rejected("Duplicado") });
    const store = useStatesStore();
    store.StateModel = loreto;

    const created = await store.setState();
    const updated = await store.ActualizarState();

    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "post", url: URL_MAIN + "insertar_state", headers: JSON_HEADERS, data: loreto });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "put", url: URL_MAIN + "actualizar_state", headers: JSON_HEADERS, data: loreto });
    expect(Swal.fire).toHaveBeenNthCalledWith(1, { icon: "success", text: "ok" });
    expect(Swal.fire).toHaveBeenNthCalledWith(2, { icon: "error", text: "Duplicado" });
    expect([created, updated]).toEqual([true, false]);
  });
});

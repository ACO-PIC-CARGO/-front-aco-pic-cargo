import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useStatesStore } from "@/stores/states";
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

  test("GetListState reads the current filters as typed and keeps the rows", async () => {
    respond({ listar_state: accepted([loreto]) });
    const store = useStatesStore();

    await store.GetListState();
    store.StateFilter = { ...store.StateFilter, id_pais: 1, code: "LO", name: "Lor", description: "d", status: "0" };
    await store.GetListState();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "get",
      url: URL_MAIN + "listar_state?&id_branch=7&name=&description=&id_pais=&status=1&code=",
      headers: JSON_HEADERS,
    });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + "listar_state?&id_branch=7&name=Lor&description=d&id_pais=1&status=0&code=LO");
    expect(store.lstState).toEqual([loreto]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
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

  test("GetListState keeps the list when the request fails", async () => {
    respond({ listar_state: new Error("network") });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const store = useStatesStore();
    store.lstState = [loreto];

    await store.GetListState();

    expect(store.lstState).toEqual([loreto]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("setState posts and ActualizarState puts the current model, each showing the answer", async () => {
    respond({ insertar_state: accepted([]), actualizar_state: rejected("Duplicado") });
    const store = useStatesStore();
    store.StateModel = loreto;

    await store.setState();
    await store.ActualizarState();

    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "post", url: URL_MAIN + "insertar_state", headers: JSON_HEADERS, data: loreto });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "put", url: URL_MAIN + "actualizar_state", headers: JSON_HEADERS, data: loreto });
    expect(Swal.fire).toHaveBeenNthCalledWith(1, { icon: "success", text: "ok" });
    expect(Swal.fire).toHaveBeenNthCalledWith(2, { icon: "error", text: "Duplicado" });
  });
});

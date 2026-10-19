import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useCityStore } from "@/stores/city";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const lima = { id: 5, id_pais: 1, id_state: 2, code: "LIM", name: "Lima", description: "", status: 1 };

describe("city store", () => {
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

  test("GetListCity reads the current filters, sends Todos as empty and keeps the rows", async () => {
    respond({ listar_city: accepted([lima]) });
    const store = useCityStore();

    await store.GetListCity();
    store.filtros = { ...store.filtros, id_pais: 1, id_state: 2, code: "LI", name: "Lim", description: "d", status: "null" };
    await store.GetListCity();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "get",
      url: URL_MAIN + "listar_city?&id_branch=7&name=&description=&id_pais=&id_state=&status=1&code=",
      headers: JSON_HEADERS,
    });
    expect(httpMock.mock.calls[1]![0].url).toBe(
      URL_MAIN + "listar_city?&id_branch=7&name=Lim&description=d&id_pais=1&id_state=2&status=&code=LI",
    );
    expect(store.lstCity).toEqual([lima]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("GetListCity empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_city: rejected() });
    const store = useCityStore();
    store.lstCity = [lima];

    await store.GetListCity();

    expect(store.lstCity).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("GetListCity sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ listar_city: rejected("Token vencido", "401") });
    const store = useCityStore();

    await store.GetListCity();
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("GetListCity keeps the list when the request fails", async () => {
    respond({ listar_city: new Error("network") });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const store = useCityStore();
    store.lstCity = [lima];

    await store.GetListCity();

    expect(store.lstCity).toEqual([lima]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("setCity posts and ActualizarCity puts the current model, each showing the answer", async () => {
    respond({ insertar_city: accepted([]), actualizar_city: rejected("Duplicado") });
    const store = useCityStore();
    store.model = lima;

    await store.setCity();
    await store.ActualizarCity();

    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "post", url: URL_MAIN + "insertar_city", headers: JSON_HEADERS, data: lima });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "put", url: URL_MAIN + "actualizar_city", headers: JSON_HEADERS, data: lima });
    expect(Swal.fire).toHaveBeenNthCalledWith(1, { icon: "success", text: "ok" });
    expect(Swal.fire).toHaveBeenNthCalledWith(2, { icon: "error", text: "Duplicado" });
  });
});

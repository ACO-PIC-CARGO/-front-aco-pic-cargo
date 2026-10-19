import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useMotonaveStore } from "@/stores/motonave";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const ship = { id: 3, name: "MSC Aurora", description: "", status: 1 };

describe("motonave store", () => {
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

  test("GetListMotonave reads the current filters, sends Todos as empty and keeps the rows", async () => {
    respond({ listar_motonave: accepted([ship]) });
    const store = useMotonaveStore();

    await store.GetListMotonave();
    store.MotonaveFilter = { ...store.MotonaveFilter, name: "MSC", description: "d", status: "null" };
    await store.GetListMotonave();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "get",
      url: URL_MAIN + "listar_motonave?&id_branch=7&name=&description=&status=1",
      headers: JSON_HEADERS,
    });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + "listar_motonave?&id_branch=7&name=MSC&description=d&status=");
    expect(store.lstMotonave).toEqual([ship]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("GetListMotonave empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_motonave: rejected() });
    const store = useMotonaveStore();
    store.lstMotonave = [ship];

    await store.GetListMotonave();

    expect(store.lstMotonave).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("GetListMotonave sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ listar_motonave: rejected("Token vencido", "401") });
    const store = useMotonaveStore();

    await store.GetListMotonave();
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("GetListMotonave keeps the list when the request fails", async () => {
    respond({ listar_motonave: new Error("network") });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const store = useMotonaveStore();
    store.lstMotonave = [ship];

    await store.GetListMotonave();

    expect(store.lstMotonave).toEqual([ship]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("setMotonave posts and ActualizarMotonave puts the current model, each showing the answer", async () => {
    respond({ insertar_motonave: accepted([]), actualizar_motonave: rejected("Duplicado") });
    const store = useMotonaveStore();
    store.MotonaveModel = ship;

    await store.setMotonave();
    await store.ActualizarMotonave();

    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "post", url: URL_MAIN + "insertar_motonave", headers: JSON_HEADERS, data: ship });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "put", url: URL_MAIN + "actualizar_motonave", headers: JSON_HEADERS, data: ship });
    expect(Swal.fire).toHaveBeenNthCalledWith(1, { icon: "success", text: "ok" });
    expect(Swal.fire).toHaveBeenNthCalledWith(2, { icon: "error", text: "Duplicado" });
  });
});

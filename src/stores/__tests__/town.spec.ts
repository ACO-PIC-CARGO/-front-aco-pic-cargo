import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useTownStore } from "@/stores/town";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const miraflores = { id: 9, id_pais: 1, id_state: 2, id_city: 5, code: "MIR", name: "Miraflores", description: "", status: 1 };

describe("town store", () => {
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

  test("GetListTown reads the current filters, sends empty ones as empty and keeps the rows", async () => {
    respond({ listar_town: accepted([miraflores]) });
    const store = useTownStore();

    await store.GetListTown();
    store.filtros = { ...store.filtros, id_pais: 1, id_city: 5, id_state: 2, id_town: 9, code: "MI", name: "Mir", description: "d", status: "0" };
    await store.GetListTown();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "get",
      url: URL_MAIN + "listar_town?&id_branch=7&id_pais=&id_city=&id_state=&id_town=&code=&name=&description=&status=1",
      headers: JSON_HEADERS,
    });
    expect(httpMock.mock.calls[1]![0].url).toBe(
      URL_MAIN + "listar_town?&id_branch=7&id_pais=1&id_city=5&id_state=2&id_town=9&code=MI&name=Mir&description=d&status=0",
    );
    expect(store.lstTown).toEqual([miraflores]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("GetListTown empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_town: rejected() });
    const store = useTownStore();
    store.lstTown = [miraflores];

    await store.GetListTown();

    expect(store.lstTown).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("GetListTown sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ listar_town: rejected("Token vencido", "401") });
    const store = useTownStore();

    await store.GetListTown();
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("GetListTown keeps the list when the request fails", async () => {
    respond({ listar_town: new Error("network") });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const store = useTownStore();
    store.lstTown = [miraflores];

    await store.GetListTown();

    expect(store.lstTown).toEqual([miraflores]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("cargarTownParaPricing loads the towns of a country quietly and empties the list when rejected", async () => {
    respond({ cargar_town_pricing: accepted([miraflores]) });
    const store = useTownStore();

    await store.cargarTownParaPricing({ id_pais: 1 });

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "cargar_town_pricing",
      params: { id_pais: 1 },
      headers: JSON_HEADERS,
    });
    expect(store.lstTown).toEqual([miraflores]);
    expect(sessionStorage.getItem("auth-token")).toBeNull();

    respond({ cargar_town_pricing: rejected() });
    await store.cargarTownParaPricing({ id_pais: 2 });

    expect(store.lstTown).toEqual([]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("setTown posts and ActualizarTown puts the current model, each showing the answer", async () => {
    respond({ insertar_town: accepted([]), actualizar_town: rejected("Duplicado") });
    const store = useTownStore();
    store.model = miraflores;

    await store.setTown();
    await store.ActualizarTown();

    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "post", url: URL_MAIN + "insertar_town", headers: JSON_HEADERS, data: miraflores });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "put", url: URL_MAIN + "actualizar_town", headers: JSON_HEADERS, data: miraflores });
    expect(Swal.fire).toHaveBeenNthCalledWith(1, { icon: "success", text: "ok" });
    expect(Swal.fire).toHaveBeenNthCalledWith(2, { icon: "error", text: "Duplicado" });
  });
});

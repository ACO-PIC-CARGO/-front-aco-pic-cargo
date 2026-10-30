import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useTownStore } from "@/stores/town";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";
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

  test("GetListTown sends only the filters the user filled and keeps the rows", async () => {
    respond({ listar_town: accepted([miraflores]) });
    const store = useTownStore();

    await store.GetListTown();
    store.filtros = { ...store.filtros, id_pais: 1, id_state: 2, id_city: null, code: "", name: "Mir", description: "d", status: "null" };
    await store.GetListTown();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "get",
      url: URL_MAIN + "listar_town",
      headers: JSON_HEADERS,
      params: { status: "1" },
    });
    expect(httpMock.mock.calls[1]![0].params).toEqual({ id_pais: 1, id_state: 2, name: "Mir", description: "d" });
    expect(store.lstTown).toEqual([miraflores]);
  });

  test("GetListTown tells whether the user may edit districts", async () => {
    const store = useTownStore();

    respond({ listar_town: accepted([{ ...miraflores, editableflag: true }]) });
    await store.GetListTown();
    const acoAdmin = store.editable;
    respond({ listar_town: accepted([{ ...miraflores, editableflag: false }]) });
    await store.GetListTown();

    expect(acoAdmin).toBe(true);
    expect(store.editable).toBe(false);
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

  test("GetListTown tells the user when the server cannot be reached", async () => {
    respond({ listar_town: new Error("network") });
    const store = useTownStore();

    await store.GetListTown();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ text: CONNECTION_ERROR_MESSAGE });
  });

  test("cargarTownParaPricing loads the Pricing districts of a country quietly and leaves the Distritos list alone", async () => {
    respond({ cargar_town_pricing: accepted([miraflores]) });
    const store = useTownStore();
    store.lstTown = [];

    await store.cargarTownParaPricing({ id_pais: 1 });

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "cargar_town_pricing",
      params: { id_pais: 1 },
      headers: JSON_HEADERS,
    });
    expect(store.lstTownPricing).toEqual([miraflores]);
    expect(store.lstTown).toEqual([]);

    respond({ cargar_town_pricing: rejected() });
    await store.cargarTownParaPricing({ id_pais: 2 });

    expect(store.lstTownPricing).toEqual([]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("setTown posts and ActualizarTown puts the current model, each showing the answer and telling whether it saved", async () => {
    respond({ insertar_town: accepted([]), actualizar_town: rejected("Duplicado") });
    const store = useTownStore();
    store.model = miraflores;

    const created = await store.setTown();
    const updated = await store.ActualizarTown();

    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "post", url: URL_MAIN + "insertar_town", headers: JSON_HEADERS, data: miraflores });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "put", url: URL_MAIN + "actualizar_town", headers: JSON_HEADERS, data: miraflores });
    expect(Swal.fire).toHaveBeenNthCalledWith(1, { icon: "success", text: "ok" });
    expect(Swal.fire).toHaveBeenNthCalledWith(2, { icon: "error", text: "Duplicado" });
    expect([created, updated]).toEqual([true, false]);
  });
});

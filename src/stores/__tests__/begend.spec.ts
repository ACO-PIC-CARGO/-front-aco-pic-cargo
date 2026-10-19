import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useBegendStore } from "@/stores/begend";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const origin = { id: 3, position: 2, code: "ORI", name: "Origen", description: "", color: "red", status: 1 };

describe("begend store", () => {
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

  test("GetListBegend reads the current filters, sends empty ones as empty and keeps the rows", async () => {
    respond({ listar_begend: accepted([origin]) });
    const store = useBegendStore();

    await store.GetListBegend();
    store.filtros = { ...store.filtros, position: 2, code: "OR", name: "Ori", description: "d", color: "red", status: "0" };
    await store.GetListBegend();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "get",
      url: URL_MAIN + "listar_begend?&id_branch=7&status=1&position=&code=&name=&description=&color=",
      headers: JSON_HEADERS,
    });
    expect(httpMock.mock.calls[1]![0].url).toBe(
      URL_MAIN + "listar_begend?&id_branch=7&status=0&position=2&code=OR&name=Ori&description=d&color=red",
    );
    expect(store.lstBegend).toEqual([origin]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("GetListBegend empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_begend: rejected() });
    const store = useBegendStore();
    store.lstBegend = [origin];

    await store.GetListBegend();

    expect(store.lstBegend).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("GetListBegend sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ listar_begend: rejected("Token vencido", "401") });
    const store = useBegendStore();

    await store.GetListBegend();
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("GetListBegend keeps the list when the request fails", async () => {
    respond({ listar_begend: new Error("network") });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const store = useBegendStore();
    store.lstBegend = [origin];

    await store.GetListBegend();

    expect(store.lstBegend).toEqual([origin]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("the position validations ask about the model and return the answer, or nothing on failure", async () => {
    respond({
      validate_position_begend: rejected("Posición libre"),
      validate_position_actualizar_begend: accepted([]),
    });
    const store = useBegendStore();
    store.model = origin;

    const created = await store.getValidatePositionBegend();
    const updated = await store.getValidatePositionActualizarBegend();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "get",
      url: URL_MAIN + "validate_position_begend?id_branch=7&position=2",
      headers: JSON_HEADERS,
    });
    expect(httpMock).toHaveBeenNthCalledWith(2, {
      method: "get",
      url: URL_MAIN + "validate_position_actualizar_begend?id_branch=7&id=3&position=2",
      headers: JSON_HEADERS,
    });
    expect(created).toEqual(rejected("Posición libre"));
    expect(updated).toEqual(accepted([]));

    vi.spyOn(console, "error").mockImplementation(() => {});
    respond({ validate_position_begend: new Error("network") });
    expect(await store.getValidatePositionBegend()).toBeUndefined();
  });

  test("setBegend posts and ActualizarBegend puts the current model, each showing the answer", async () => {
    respond({ insertar_begend: accepted([]), actualizar_begend: rejected("Duplicado") });
    const store = useBegendStore();
    store.model = origin;

    await store.setBegend();
    await store.ActualizarBegend();

    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "post", url: URL_MAIN + "insertar_begend", headers: JSON_HEADERS, data: origin });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "put", url: URL_MAIN + "actualizar_begend", headers: JSON_HEADERS, data: origin });
    expect(Swal.fire).toHaveBeenNthCalledWith(1, { icon: "success", text: "ok" });
    expect(Swal.fire).toHaveBeenNthCalledWith(2, { icon: "error", text: "Duplicado" });
  });
});

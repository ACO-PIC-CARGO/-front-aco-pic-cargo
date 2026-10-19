import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { usePerformanceStore } from "@/stores/performance";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const row = { id: 3, code: "FAC", description: "Factura", status: 1 };
const filters = { code: "F C", description: "a/b", status: 1 };
const defaultFilters = "listar_performance?id_branch=7&code=&description=&status=1";

describe("performance store", () => {
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

  test("fetchDataPerformance lists with the encoded filters, keeps the rows and marks the list loaded", async () => {
    const performance = usePerformanceStore();
    let loadingDuringRequest: boolean | undefined;
    httpMock.mockImplementation(async () => {
      loadingDuringRequest = performance.loading;
      return { data: accepted([row]) };
    });
    performance.loading = true;

    await performance.fetchDataPerformance(filters);

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "listar_performance?id_branch=7&code=F%20C&description=a%2Fb&status=1",
      headers: JSON_HEADERS,
    });
    expect(loadingDuringRequest).toBe(false);
    expect(performance.list).toEqual([row]);
    expect(performance.loading).toBe(true);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("fetchDataPerformance empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_performance: rejected() });
    const performance = usePerformanceStore();
    performance.list = [row];

    await performance.fetchDataPerformance(filters);

    expect(performance.list).toEqual([]);
    expect(performance.loading).toBe(true);
    expect(Swal.fire).toHaveBeenCalledWith({
      icon: "info",
      text: "No se encontraron registros",
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
    });
    await flushPromises();
    expect(router.push).not.toHaveBeenCalled();
  });

  test("fetchDataPerformance sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ listar_performance: rejected("Token vencido", "401") });
    const performance = usePerformanceStore();

    await performance.fetchDataPerformance(filters);
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("fetchDataPerformance keeps the list and the loading flag when the request fails", async () => {
    respond({ listar_performance: new Error("network") });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const performance = usePerformanceStore();
    performance.list = [row];

    await performance.fetchDataPerformance(filters);

    expect(performance.list).toEqual([row]);
    expect(performance.loading).toBe(false);
    expect(log).toHaveBeenCalledWith("Error al obtener los datos:", expect.any(Error));
  });

  test("insertPerformance posts the record and reloads the unfiltered list once the user closes the message", async () => {
    respond({ insertar_performance: accepted([]), listar_performance: accepted([row]) });
    const performance = usePerformanceStore();

    await performance.insertPerformance({ code: "FAC", description: "Factura", status: 1 });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "insertar_performance",
      headers: JSON_HEADERS,
      data: { code: "FAC", description: "Factura", status: 1 },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + defaultFilters);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("updatePerformance puts the record, shows the backend error and still reloads the list", async () => {
    respond({ actualizar_performance: rejected("Duplicado"), listar_performance: accepted([]) });
    const performance = usePerformanceStore();

    await performance.updatePerformance({ code: "FAC", description: "Factura", status: 1 });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "put",
      url: URL_MAIN + "actualizar_performance",
      headers: JSON_HEADERS,
      data: { code: "FAC", description: "Factura", status: 1 },
    });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Duplicado" });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + defaultFilters);
  });

  test("readPerformance keeps the first row as the record, or shows the backend message", async () => {
    respond({ ver_performance: accepted([row]) });
    const performance = usePerformanceStore();

    await performance.readPerformance(3);

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "ver_performance?id=3", headers: JSON_HEADERS });
    expect(performance.record).toEqual(row);

    respond({ ver_performance: rejected("No existe") });
    await performance.readPerformance(9);
    expect(performance.record).toEqual(row);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No existe" });
  });
});

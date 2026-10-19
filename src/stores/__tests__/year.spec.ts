import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useYearStore } from "@/stores/year";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const y2026 = { id: 3, description: "2026", status: 1 };
const defaultFilters = "listar_year?id_branch=7&description=&status=1";

describe("year store", () => {
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

  test("fetchDataYear lists with the encoded filter, keeps the rows and marks the list loaded", async () => {
    const year = useYearStore();
    let loadingDuringRequest: boolean | undefined;
    httpMock.mockImplementation(async () => {
      loadingDuringRequest = year.loading;
      return { data: accepted([y2026]) };
    });
    year.loading = true;

    await year.fetchDataYear({ description: "20 26", status: 1 });

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "listar_year?id_branch=7&description=20%2026&status=1",
      headers: JSON_HEADERS,
    });
    expect(loadingDuringRequest).toBe(false);
    expect(year.list).toEqual([y2026]);
    expect(year.loading).toBe(true);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("fetchDataYear empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_year: rejected() });
    const year = useYearStore();
    year.list = [y2026];

    await year.fetchDataYear({ description: "", status: 1 });

    expect(year.list).toEqual([]);
    expect(year.loading).toBe(true);
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

  test("fetchDataYear sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ listar_year: rejected("Token vencido", "401") });

    await useYearStore().fetchDataYear({ description: "", status: 1 });
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("fetchDataYear keeps the list and the loading flag when the request fails", async () => {
    respond({ listar_year: new Error("network") });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const year = useYearStore();
    year.list = [y2026];

    await year.fetchDataYear({ description: "", status: 1 });

    expect(year.list).toEqual([y2026]);
    expect(year.loading).toBe(false);
    expect(error).toHaveBeenCalledWith("Error al obtener los datos:", expect.any(Error));
  });

  test("insertYear posts the record and reloads the unfiltered list only when the user closes the message", async () => {
    respond({ insertar_year: accepted([]), listar_year: accepted([y2026]) });
    const year = useYearStore();

    await year.insertYear({ description: "2026", status: 1 });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "insertar_year",
      headers: JSON_HEADERS,
      data: { description: "2026", status: 1 },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + defaultFilters);

    httpMock.mockClear();
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
    await year.insertYear({ description: "2027", status: 1 });
    await flushPromises();
    expect(httpMock).toHaveBeenCalledTimes(1);
  });

  test("updateYear puts the record, shows the backend error and still reloads the list", async () => {
    respond({ actualizar_year: rejected("Duplicado"), listar_year: accepted([]) });
    const year = useYearStore();

    await year.updateYear({ id: 3, description: "2026", status: 0 });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "put",
      url: URL_MAIN + "actualizar_year",
      headers: JSON_HEADERS,
      data: { id: 3, description: "2026", status: 0 },
    });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Duplicado" });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + defaultFilters);
  });

  test("readYear keeps the first row as the record, or shows the backend message", async () => {
    respond({ ver_year: accepted([y2026]) });
    const year = useYearStore();

    await year.readYear(3);

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "ver_year?id=3", headers: JSON_HEADERS });
    expect(year.record).toEqual(y2026);

    respond({ ver_year: rejected("No existe") });
    await year.readYear(9);
    expect(year.record).toEqual(y2026);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No existe" });
  });
});

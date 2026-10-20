import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { toRaw } from "vue";
import Swal from "sweetalert2";
import router from "@/router";
import { useAduanaStore } from "@/stores/aduana";
import { useModalityStore } from "@/stores/modality";
import { usePricingStore } from "@/stores/pricing";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const row = { id: 3, code: "EXP", name: "Exportación", description: "", status: 1 };
const filters = { code: "E X", name: "Ex & más", description: "a/b", status: 1 };
const defaultFilters = "listar_modality?id_branch=7&code=&name=&description=&status=1";
const aduanaCopy = () => toRaw(useAduanaStore().listModality);

describe("modality store", () => {
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

  test("fetchDataModality lists with the encoded filters, keeps the rows and marks the list loaded", async () => {
    const modality = useModalityStore();
    let loadingDuringRequest: boolean | undefined;
    httpMock.mockImplementation(async () => {
      loadingDuringRequest = modality.loading;
      return { data: accepted([row]) };
    });
    modality.loading = true;

    await modality.fetchDataModality(filters);

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "listar_modality?id_branch=7&code=E%20X&name=Ex%20%26%20m%C3%A1s&description=a%2Fb&status=1",
      headers: JSON_HEADERS,
    });
    expect(loadingDuringRequest).toBe(false);
    expect(modality.list).toEqual([row]);
    expect(modality.loading).toBe(true);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
    expect(Swal.fire).not.toHaveBeenCalled();
    expect(aduanaCopy()).toBe(toRaw(modality.list));
    expect(toRaw(usePricingStore().listModality)).toBe(toRaw(modality.list));
  });

  test("fetchDataModality empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_modality: rejected() });
    const modality = useModalityStore();
    modality.list = [row];

    await modality.fetchDataModality(filters);

    expect(modality.list).toEqual([]);
    expect(modality.loading).toBe(true);
    expect(Swal.fire).toHaveBeenCalledWith({
      icon: "info",
      text: "No se encontraron registros",
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
    });
    expect(aduanaCopy()).toEqual([]);
    await flushPromises();
    expect(router.push).not.toHaveBeenCalled();
  });

  test("fetchDataModality sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ listar_modality: rejected("Token vencido", "401") });
    const modality = useModalityStore();

    await modality.fetchDataModality(filters);
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("fetchDataModality keeps the list and the loading flag when the request fails", async () => {
    respond({ listar_modality: new Error("network") });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const modality = useModalityStore();
    modality.list = [row];
    useAduanaStore().listModality = [row];

    await modality.fetchDataModality(filters);

    expect(modality.list).toEqual([row]);
    expect(modality.loading).toBe(false);
    expect(log).toHaveBeenCalledWith("Error al obtener los datos:", expect.any(Error));
    expect(aduanaCopy()).toEqual([row]);
  });

  test("insertModality posts the record and reloads the unfiltered list once the user closes the message", async () => {
    respond({ insertar_modality: accepted([]), listar_modality: accepted([row]) });
    const modality = useModalityStore();

    await modality.insertModality({ code: "EXP", name: "Exportación", status: 1 });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "insertar_modality",
      headers: JSON_HEADERS,
      data: { code: "EXP", name: "Exportación", status: 1 },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + defaultFilters);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("updateModality puts the record, shows the backend error and still reloads the list", async () => {
    respond({ actualizar_modality: rejected("Duplicado"), listar_modality: accepted([]) });
    const modality = useModalityStore();

    await modality.updateModality({ code: "EXP", name: "Exportación", status: 1 });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "put",
      url: URL_MAIN + "actualizar_modality",
      headers: JSON_HEADERS,
      data: { code: "EXP", name: "Exportación", status: 1 },
    });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Duplicado" });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + defaultFilters);
  });

  test("readModality keeps the first row as the record, or shows the backend message", async () => {
    respond({ ver_modality: accepted([row]) });
    const modality = useModalityStore();

    await modality.readModality(3);

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "ver_modality?id=3", headers: JSON_HEADERS });
    expect(modality.record).toEqual(row);

    respond({ ver_modality: rejected("No existe") });
    await modality.readModality(9);
    expect(modality.record).toEqual(row);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No existe" });
  });
});

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { toRaw } from "vue";
import Swal from "sweetalert2";
import router from "@/router";
import { useAduanaStore } from "@/stores/aduana";
import { useMultiplicadorStore } from "@/stores/multiplicador";
import { usePricingStore } from "@/stores/pricing";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const lcl = { id: 3, name: "LCL", description: "", id_shipment: 2, valor: "0.5", status: 1 };
const filters = { code: "L C", name: "L & más", description: "a/b", id_shipment: 2, status: 1 };
const defaultFilters = "listar_multiplicador?id_branch=7&code=&name=&description=&id_shipment=&status=1";
const aduanaCopy = () => toRaw(useAduanaStore().listShipment);

describe("multiplicador store", () => {
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

  test("fetchDataCargarShipment fills the cargo type dropdown and hands the same rows to pricing and aduana, only when the backend accepts", async () => {
    const fcl = { id: 1, code: "FCL", name: "FCL", status: 1 };
    respond({ cargar_shipment: accepted([fcl]) });
    const multiplicador = useMultiplicadorStore();

    await multiplicador.fetchDataCargarShipment();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "cargar_shipment?id_branch=7",
      headers: JSON_HEADERS,
    });
    expect(multiplicador.shipments).toEqual([fcl]);
    expect(aduanaCopy()).toBe(toRaw(multiplicador.shipments));
    expect(toRaw(usePricingStore().listShipment)).toBe(toRaw(multiplicador.shipments));
    expect(sessionStorage.getItem("auth-token")).toBe("tok");

    respond({ cargar_shipment: rejected() });
    await multiplicador.fetchDataCargarShipment();
    expect(multiplicador.shipments).toEqual([fcl]);
    expect(aduanaCopy()).toBe(toRaw(multiplicador.shipments));
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("fetchDataMultiplicador lists with the filters, keeps the rows and marks the list loaded", async () => {
    const multiplicador = useMultiplicadorStore();
    let loadingDuringRequest: boolean | undefined;
    httpMock.mockImplementation(async () => {
      loadingDuringRequest = multiplicador.loading;
      return { data: accepted([lcl]) };
    });
    multiplicador.loading = true;

    await multiplicador.fetchDataMultiplicador(filters);

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "listar_multiplicador?id_branch=7&code=L%20C&name=L%20%26%20m%C3%A1s&description=a%2Fb&id_shipment=2&status=1",
      headers: JSON_HEADERS,
    });
    expect(loadingDuringRequest).toBe(false);
    expect(multiplicador.list).toEqual([lcl]);
    expect(multiplicador.loading).toBe(true);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("fetchDataMultiplicador empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_multiplicador: rejected() });
    const multiplicador = useMultiplicadorStore();
    multiplicador.list = [lcl];

    await multiplicador.fetchDataMultiplicador(filters);

    expect(multiplicador.list).toEqual([]);
    expect(multiplicador.loading).toBe(true);
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

  test("fetchDataMultiplicador sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ listar_multiplicador: rejected("Token vencido", "401") });

    await useMultiplicadorStore().fetchDataMultiplicador(filters);
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("fetchDataMultiplicador keeps the list and the loading flag when the request fails", async () => {
    respond({ listar_multiplicador: new Error("network") });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const multiplicador = useMultiplicadorStore();
    multiplicador.list = [lcl];

    await multiplicador.fetchDataMultiplicador(filters);

    expect(multiplicador.list).toEqual([lcl]);
    expect(multiplicador.loading).toBe(false);
    expect(log).toHaveBeenCalledWith("Error al obtener los datos:", expect.any(Error));
  });

  test("updateMultiplicador puts the record, shows the backend error and still reloads the list", async () => {
    respond({ actualizar_multiplicador: rejected("Duplicado"), listar_multiplicador: accepted([]) });

    await useMultiplicadorStore().updateMultiplicador({ id: 3, valor: "0.7" });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "put",
      url: URL_MAIN + "actualizar_multiplicador",
      headers: JSON_HEADERS,
      data: { id: 3, valor: "0.7" },
    });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Duplicado" });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + defaultFilters);
  });

  test("nuevoMultiplicador posts the record with the branch and reloads the unfiltered list once the user closes the message", async () => {
    respond({ nuevo_multiplicador: accepted([]), listar_multiplicador: accepted([lcl]) });

    await useMultiplicadorStore().nuevoMultiplicador({ name: "LCL", valor: "0.5" });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "nuevo_multiplicador",
      headers: JSON_HEADERS,
      data: { name: "LCL", valor: "0.5", id_branch: 7 },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + defaultFilters);
  });

  test("readMultiplicador keeps the first row as the record, or shows the backend message", async () => {
    respond({ ver_multiplicador: accepted([lcl]) });
    const multiplicador = useMultiplicadorStore();

    await multiplicador.readMultiplicador(3);

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "ver_multiplicador?id=3", headers: JSON_HEADERS });
    expect(multiplicador.record).toEqual(lcl);

    respond({ ver_multiplicador: rejected("No existe") });
    await multiplicador.readMultiplicador(9);
    expect(multiplicador.record).toEqual(lcl);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No existe" });
  });
});

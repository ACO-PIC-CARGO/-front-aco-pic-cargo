import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { toRaw } from "vue";
import Swal from "sweetalert2";
import router from "@/router";
import { useAduanaStore } from "@/stores/aduana";
import { useMultiplicadorStore } from "@/stores/multiplicador";
import { usePricingStore } from "@/stores/pricing";
import { useShipmentStore } from "@/stores/shipment";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
vi.mock("@/store", () => ({ default: { commit: vi.fn() } }));

const fcl = { id: 3, code: "FCL", name: "FCL", description: "", id_transport: 1, status: 1 };
const filters = { id_transport: 2, name: "F C", description: "a/b", status: 1 };
const defaultFilters = "listar_shipment?id_branch=7&id_transport=&name=&description=&status=1";
const aduanaCopy = () => toRaw(useAduanaStore().listShipment);

describe("shipment store", () => {
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

  test("fetchDataShipment lists with the filters, marks the list loaded and hands the same rows to multiplicador, pricing and aduana", async () => {
    const shipment = useShipmentStore();
    let loadingDuringRequest: boolean | undefined;
    httpMock.mockImplementation(async () => {
      loadingDuringRequest = shipment.loading;
      return { data: accepted([fcl]) };
    });
    shipment.loading = true;

    await shipment.fetchDataShipment(filters);

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "listar_shipment?id_branch=7&id_transport=2&name=F%20C&description=a%2Fb&status=1",
      headers: JSON_HEADERS,
    });
    expect(loadingDuringRequest).toBe(false);
    expect(shipment.list).toEqual([fcl]);
    expect(shipment.loading).toBe(true);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
    expect(Swal.fire).not.toHaveBeenCalled();
    expect(toRaw(useMultiplicadorStore().shipments)).toBe(toRaw(shipment.list));
    expect(aduanaCopy()).toBe(toRaw(shipment.list));
    expect(toRaw(usePricingStore().listShipment)).toBe(toRaw(shipment.list));
  });

  test("fetchDataShipment empties every copy of the list and tells the user when the backend rejects", async () => {
    respond({ listar_shipment: rejected() });
    const shipment = useShipmentStore();
    shipment.list = [fcl];

    await shipment.fetchDataShipment(filters);

    expect(shipment.list).toEqual([]);
    expect(shipment.loading).toBe(true);
    expect(useMultiplicadorStore().shipments).toEqual([]);
    expect(aduanaCopy()).toEqual([]);
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

  test("fetchDataShipment sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ listar_shipment: rejected("Token vencido", "401") });

    await useShipmentStore().fetchDataShipment(filters);
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("fetchDataShipment keeps the lists and the loading flag when the request fails", async () => {
    respond({ listar_shipment: new Error("network") });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const shipment = useShipmentStore();
    shipment.list = [fcl];
    useMultiplicadorStore().shipments = [fcl];
    useAduanaStore().listShipment = [fcl];

    await shipment.fetchDataShipment(filters);

    expect(shipment.list).toEqual([fcl]);
    expect(useMultiplicadorStore().shipments).toEqual([fcl]);
    expect(shipment.loading).toBe(false);
    expect(aduanaCopy()).toEqual([fcl]);
    expect(log).toHaveBeenCalledWith("Error al obtener los datos:", expect.any(Error));
  });

  test("insertShipment posts the record and reloads the unfiltered list once the user closes the message", async () => {
    respond({ insertar_shipment: accepted([]), listar_shipment: accepted([fcl]) });
    const shipment = useShipmentStore();

    await shipment.insertShipment({ code: "FCL", name: "FCL", id_transport: 1, status: 1 });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "insertar_shipment",
      headers: JSON_HEADERS,
      data: { code: "FCL", name: "FCL", id_transport: 1, status: 1 },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + defaultFilters);
  });

  test("updateShipment puts the record, shows the backend error and still reloads the list", async () => {
    respond({ actualizar_shipment: rejected("Duplicado"), listar_shipment: accepted([]) });

    await useShipmentStore().updateShipment({ id: 3, name: "X" });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "put",
      url: URL_MAIN + "actualizar_shipment",
      headers: JSON_HEADERS,
      data: { id: 3, name: "X" },
    });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Duplicado" });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + defaultFilters);
  });

  test("readShipment keeps the first row as the record, or shows the backend message", async () => {
    respond({ ver_shipment: accepted([fcl]) });
    const shipment = useShipmentStore();

    await shipment.readShipment(3);

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "ver_shipment?id=3", headers: JSON_HEADERS });
    expect(shipment.record).toEqual(fcl);

    respond({ ver_shipment: rejected("No existe") });
    await shipment.readShipment(9);
    expect(shipment.record).toEqual(fcl);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No existe" });
  });

  test("fetchDataCargarTransport fills the transport dropdown, and on rejection tells the user and keeps what it had", async () => {
    const sea = { id: 1, code: "MAR", name: "Marítimo", description: "", status: 1 };
    respond({ cargar_transports: accepted([sea]) });
    const shipment = useShipmentStore();

    await shipment.fetchDataCargarTransport();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "cargar_transports?id_branch=7",
      headers: JSON_HEADERS,
    });
    expect(shipment.transports).toEqual([sea]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");

    respond({ cargar_transports: rejected("Sin transportes") });
    await shipment.fetchDataCargarTransport();
    expect(shipment.transports).toEqual([sea]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "Sin transportes" });
  });
});

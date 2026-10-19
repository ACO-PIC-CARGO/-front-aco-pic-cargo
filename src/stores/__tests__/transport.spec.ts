import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { toRaw } from "vue";
import Swal from "sweetalert2";
import router from "@/router";
import { useShipmentStore } from "@/stores/shipment";
import { useTransportStore } from "@/stores/transport";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
vi.mock("@/store", () => ({ default: { commit: vi.fn() } }));

const row = { id: 3, code: "MAR", name: "Marítimo", description: "", status: 1 };
const filters = { code: "M R", name: "Mar & más", description: "a/b", status: 1 };
const defaultFilters = "listar_transport?id_branch=7&code=&name=&description=&status=1";

describe("transport store", () => {
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

  test("fetchDataTransport lists with the encoded filters, keeps the rows and marks the list loaded", async () => {
    const transport = useTransportStore();
    let loadingDuringRequest: boolean | undefined;
    httpMock.mockImplementation(async () => {
      loadingDuringRequest = transport.loading;
      return { data: accepted([row]) };
    });
    transport.loading = true;

    await transport.fetchDataTransport(filters);

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "listar_transport?id_branch=7&code=M%20R&name=Mar%20%26%20m%C3%A1s&description=a%2Fb&status=1",
      headers: JSON_HEADERS,
    });
    expect(loadingDuringRequest).toBe(false);
    expect(transport.list).toEqual([row]);
    expect(transport.loading).toBe(true);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
    expect(Swal.fire).not.toHaveBeenCalled();
    expect(toRaw(useShipmentStore().transports)).toBe(toRaw(transport.list));
  });

  test("fetchDataTransport empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_transport: rejected() });
    const transport = useTransportStore();
    transport.list = [row];

    await transport.fetchDataTransport(filters);

    expect(transport.list).toEqual([]);
    expect(transport.loading).toBe(true);
    expect(useShipmentStore().transports).toEqual([]);
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

  test("fetchDataTransport sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ listar_transport: rejected("Token vencido", "401") });
    const transport = useTransportStore();

    await transport.fetchDataTransport(filters);
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("fetchDataTransport keeps the list and the loading flag when the request fails", async () => {
    respond({ listar_transport: new Error("network") });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const transport = useTransportStore();
    transport.list = [row];
    useShipmentStore().transports = [row];

    await transport.fetchDataTransport(filters);

    expect(transport.list).toEqual([row]);
    expect(transport.loading).toBe(false);
    expect(useShipmentStore().transports).toEqual([row]);
    expect(log).toHaveBeenCalledWith("Error al obtener los datos:", expect.any(Error));
  });

  test("insertTransport posts the record and reloads the unfiltered list once the user closes the message", async () => {
    respond({ insertar_transport: accepted([]), listar_transport: accepted([row]) });
    const transport = useTransportStore();

    await transport.insertTransport({ code: "MAR", name: "Marítimo", status: 1 });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "insertar_transport",
      headers: JSON_HEADERS,
      data: { code: "MAR", name: "Marítimo", status: 1 },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + defaultFilters);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("updateTransport puts the record, shows the backend error and still reloads the list", async () => {
    respond({ actualizar_transport: rejected("Duplicado"), listar_transport: accepted([]) });
    const transport = useTransportStore();

    await transport.updateTransport({ code: "MAR", name: "Marítimo", status: 1 });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "put",
      url: URL_MAIN + "actualizar_transport",
      headers: JSON_HEADERS,
      data: { code: "MAR", name: "Marítimo", status: 1 },
    });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Duplicado" });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + defaultFilters);
  });

  test("readTransport keeps the first row as the record, or shows the backend message", async () => {
    respond({ ver_transport: accepted([row]) });
    const transport = useTransportStore();

    await transport.readTransport(3);

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "ver_transport?id=3", headers: JSON_HEADERS });
    expect(transport.record).toEqual(row);

    respond({ ver_transport: rejected("No existe") });
    await transport.readTransport(9);
    expect(transport.record).toEqual(row);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No existe" });
  });

  test("cargarTransport loads the branch transports into the list and into the tipo de carga dropdown, empty on rejection", async () => {
    respond({ cargar_transport: accepted([row]) });
    const transport = useTransportStore();

    await transport.cargarTransport();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "cargar_transport?id_branch=7",
      headers: JSON_HEADERS,
    });
    expect(transport.list).toEqual([row]);
    expect(toRaw(useShipmentStore().transports)).toBe(toRaw(transport.list));
    expect(transport.loading).toBe(false);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
    expect(Swal.fire).not.toHaveBeenCalled();

    respond({ cargar_transport: rejected() });
    await transport.cargarTransport();
    expect(transport.list).toEqual([]);
    expect(useShipmentStore().transports).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("cargarTransport keeps both lists when the request fails", async () => {
    respond({ cargar_transport: new Error("network") });
    vi.spyOn(console, "log").mockImplementation(() => {});
    const transport = useTransportStore();
    transport.list = [row];
    useShipmentStore().transports = [row];

    await transport.cargarTransport();

    expect(transport.list).toEqual([row]);
    expect(useShipmentStore().transports).toEqual([row]);
  });
});

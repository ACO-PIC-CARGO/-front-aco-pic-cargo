import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useIngresosStore } from "@/stores/ingresos";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const venta = { id: 1, code: "VMO", description: "VENTA DE MERCANCIA OFICINA", calculoflag: true, status: true };
const defaultList = URL_MAIN + "listar_ingreso?id_branch=7&code=&description=&calculoflag=&status=true";

describe("ingresos store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  test("cargarIngreso fills the list without touching the loading flag", async () => {
    respond({ cargar_ingreso: accepted([venta]) });
    const store = useIngresosStore();

    await store.cargarIngreso();

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "cargar_ingreso?id_branch=7", headers: JSON_HEADERS });
    expect(store.list).toEqual([venta]);
    expect(store.loading).toBe(false);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("cargarIngreso empties the list and tells the user when the backend rejects", async () => {
    respond({ cargar_ingreso: rejected() });
    const store = useIngresosStore();
    store.list = [venta];

    await store.cargarIngreso();

    expect(store.list).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("fetchDataIngreso lists with the encoded code and description and the raw flags, and marks the list loaded either way", async () => {
    const store = useIngresosStore();
    let loadingDuringRequest: boolean | undefined;
    httpMock.mockImplementation(async () => {
      loadingDuringRequest = store.loading;
      return { data: accepted([venta]) };
    });
    store.loading = true;

    await store.fetchDataIngreso({ code: "V M", description: "a/b", calculoflag: true, status: "" });

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "listar_ingreso?id_branch=7&code=V%20M&description=a%2Fb&calculoflag=true&status=",
      headers: JSON_HEADERS,
    });
    expect(loadingDuringRequest).toBe(false);
    expect(store.list).toEqual([venta]);
    expect(store.loading).toBe(true);

    respond({ listar_ingreso: rejected() });
    await store.fetchDataIngreso({ code: "", description: "", calculoflag: "", status: true });
    expect(store.list).toEqual([]);
    expect(store.loading).toBe(true);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("insertIngreso posts the record and reloads the active list once the user closes the message", async () => {
    respond({ insertar_ingreso: accepted([]), listar_ingreso: accepted([venta]) });
    const store = useIngresosStore();

    await store.insertIngreso({ code: "VMO" });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "insertar_ingreso",
      headers: JSON_HEADERS,
      data: { code: "VMO" },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(httpMock.mock.calls[1]![0].url).toBe(defaultList);
  });

  test("updateIngreso puts the record, shows the backend error and still reloads the active list", async () => {
    respond({ actualizar_ingreso: rejected("Duplicado"), listar_ingreso: accepted([]) });
    const store = useIngresosStore();

    await store.updateIngreso({ id: 1, description: "X" });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "put",
      url: URL_MAIN + "actualizar_ingreso",
      headers: JSON_HEADERS,
      data: { id: 1, description: "X" },
    });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Duplicado" });
    expect(httpMock.mock.calls[1]![0].url).toBe(defaultList);
  });

  test("readIngreso keeps the first row as the record, or shows the backend message", async () => {
    respond({ ver_ingreso: accepted([venta]) });
    const store = useIngresosStore();

    await store.readIngreso(1);

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "ver_ingreso?id=1", headers: JSON_HEADERS });
    expect(store.record).toEqual(venta);

    respond({ ver_ingreso: rejected("No existe") });
    await store.readIngreso(9);
    expect(store.record).toEqual(venta);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No existe" });
  });

  test("ActualizarCXC and ActualizarCXP put the payment and only show the answer", async () => {
    respond({ actualizar_cxc: accepted([]), actualizar_cxp: rejected("Sin saldo") });
    const store = useIngresosStore();

    await store.ActualizarCXC({ id: 5, monto: 10 });
    await store.ActualizarCXP({ id: 6, monto: 20 });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "put", url: URL_MAIN + "actualizar_cxc", headers: JSON_HEADERS, data: { id: 5, monto: 10 } });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "put", url: URL_MAIN + "actualizar_cxp", headers: JSON_HEADERS, data: { id: 6, monto: 20 } });
    expect(httpMock).toHaveBeenCalledTimes(2);
    expect(Swal.fire).toHaveBeenNthCalledWith(1, { icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(Swal.fire).toHaveBeenNthCalledWith(2, { icon: "error", text: "Sin saldo", showCancelButton: false, confirmButtonText: "Ok" });
  });
});

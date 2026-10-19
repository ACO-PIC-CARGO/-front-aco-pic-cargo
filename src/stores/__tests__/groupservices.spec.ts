import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useGroupservicesStore } from "@/stores/groupservices";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const transporte = { id: 1, code: "001", name: "TRANSPORTE EN ORIGEN", description: "", status: 1 };
const defaultList = URL_MAIN + "listar_groupservices?id_branch=7&code=&name=&description=&status=1";

describe("groupservices store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  test("CargarGroupServices loads every service of the branch and marks the list loaded", async () => {
    const store = useGroupservicesStore();
    let loadingDuringRequest: boolean | undefined;
    httpMock.mockImplementation(async () => {
      loadingDuringRequest = store.loading;
      return { data: accepted([transporte]) };
    });
    store.loading = true;

    await store.CargarGroupServices();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "cargar_groupservices?id_branch=7\n         ",
      headers: JSON_HEADERS,
    });
    expect(loadingDuringRequest).toBe(false);
    expect(store.list).toEqual([transporte]);
    expect(store.loading).toBe(true);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("CargarGroupServices empties the list and tells the user when the backend rejects", async () => {
    respond({ cargar_groupservices: rejected() });
    const store = useGroupservicesStore();
    store.list = [transporte];

    await store.CargarGroupServices();

    expect(store.list).toEqual([]);
    expect(store.loading).toBe(true);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("fetchDataGroupServices lists with the encoded filters and marks the list loaded", async () => {
    respond({ listar_groupservices: accepted([transporte]) });
    const store = useGroupservicesStore();

    await store.fetchDataGroupServices({ code: "0 1", name: "A/B", description: "x&y", status: "" });

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "listar_groupservices?id_branch=7&code=0%201&name=A%2FB&description=x%26y&status=",
      headers: JSON_HEADERS,
    });
    expect(store.list).toEqual([transporte]);
    expect(store.loading).toBe(true);

    respond({ listar_groupservices: rejected() });
    await store.fetchDataGroupServices({ code: "", name: "", description: "", status: 1 });
    expect(store.list).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("insertGroupServices posts the record and reloads the unfiltered list once the user closes the message", async () => {
    respond({ insertar_groupservices: accepted([]), listar_groupservices: accepted([transporte]) });
    const store = useGroupservicesStore();

    await store.insertGroupServices({ name: "ADUANA", status: 1 });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "insertar_groupservices",
      headers: JSON_HEADERS,
      data: { name: "ADUANA", status: 1 },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(httpMock.mock.calls[1]![0].url).toBe(defaultList);
  });

  test("updateGroupServices puts the record, shows the backend error and still reloads the list", async () => {
    respond({ actualizar_groupservices: rejected("Duplicado"), listar_groupservices: accepted([]) });
    const store = useGroupservicesStore();

    await store.updateGroupServices({ id: 1, name: "X" });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "put",
      url: URL_MAIN + "actualizar_groupservices",
      headers: JSON_HEADERS,
      data: { id: 1, name: "X" },
    });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Duplicado" });
    expect(httpMock.mock.calls[1]![0].url).toBe(defaultList);
  });

  test("readGroupServices keeps the first row as the record, or shows the backend message", async () => {
    respond({ ver_groupservices: accepted([transporte]) });
    const store = useGroupservicesStore();

    await store.readGroupServices(1);

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "ver_groupservices?id=1", headers: JSON_HEADERS });
    expect(store.record).toEqual(transporte);

    respond({ ver_groupservices: rejected("No existe") });
    await store.readGroupServices(9);
    expect(store.record).toEqual(transporte);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No existe" });
  });
});

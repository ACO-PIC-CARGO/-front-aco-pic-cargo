import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useContainersStore } from "@/stores/containers";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const box = { id: 1, code: "20S", name: "20 Standard", description: null, long: 5.89, width: 2.35, height: 2.38, maximumweight: 26, maximunvolumen: 33, status: 1 };
const defaultList = URL_MAIN + "listar_containers?id_branch=7&code=&name=&description=&status=1";

describe("containers store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  test("fetchDataContainers lists with the encoded filters, keeps the rows and marks the list loaded", async () => {
    const store = useContainersStore();
    let loadingDuringRequest: boolean | undefined;
    httpMock.mockImplementation(async () => {
      loadingDuringRequest = store.loading;
      return { data: accepted([box]) };
    });
    store.loading = true;

    await store.fetchDataContainers({ code: "20 S", name: "20/40", description: "a&b", status: "" });

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "listar_containers?id_branch=7&code=20%20S&name=20%2F40&description=a%26b&status=",
      headers: JSON_HEADERS,
    });
    expect(loadingDuringRequest).toBe(false);
    expect(store.list).toEqual([box]);
    expect(store.loading).toBe(true);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("fetchDataContainers empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_containers: rejected() });
    const store = useContainersStore();
    store.list = [box];

    await store.fetchDataContainers({ code: "", name: "", description: "", status: 1 });

    expect(store.list).toEqual([]);
    expect(store.loading).toBe(true);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("insertContainers posts the record and reloads the unfiltered list once the user closes the message", async () => {
    respond({ insertar_containers: accepted([]), listar_containers: accepted([box]) });
    const store = useContainersStore();

    await store.insertContainers({ name: "40HC", status: 1 });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "insertar_containers",
      headers: JSON_HEADERS,
      data: { name: "40HC", status: 1 },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(httpMock.mock.calls[1]![0].url).toBe(defaultList);
    expect(store.list).toEqual([box]);
  });

  test("updateContainers puts the record, shows the backend error and still reloads the list", async () => {
    respond({ actualizar_containers: rejected("Duplicado"), listar_containers: accepted([]) });
    const store = useContainersStore();

    await store.updateContainers({ id: 1, name: "20 Standard" });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "put",
      url: URL_MAIN + "actualizar_containers",
      headers: JSON_HEADERS,
      data: { id: 1, name: "20 Standard" },
    });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Duplicado" });
    expect(httpMock.mock.calls[1]![0].url).toBe(defaultList);
  });

  test("readContainers keeps the first row as the record, or shows the backend message", async () => {
    respond({ ver_containers: accepted([box]) });
    const store = useContainersStore();

    await store.readContainers(1);

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "ver_containers?id=1", headers: JSON_HEADERS });
    expect(store.record).toEqual(box);

    respond({ ver_containers: rejected("No existe") });
    await store.readContainers(9);
    expect(store.record).toEqual(box);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No existe" });
  });
});

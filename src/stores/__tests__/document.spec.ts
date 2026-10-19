import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useDocumentStore } from "@/stores/document";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const dni = { id: 1, code: "01", name: "DNI", description: "Documento nacional", status: 1 };
const defaultList = URL_MAIN + "listar_documents?code=&name=&description=&status=1&id_branch=7";

describe("document store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  test("fetchDataDocument lists with the encoded filters and the branch last, keeps the rows and marks the list loaded", async () => {
    const store = useDocumentStore();
    let loadingDuringRequest: boolean | undefined;
    httpMock.mockImplementation(async () => {
      loadingDuringRequest = store.loading;
      return { data: accepted([dni]) };
    });
    store.loading = true;

    await store.fetchDataDocument({ code: "0 1", name: "D/NI", description: "", status: 0 });

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "listar_documents?code=0%201&name=D%2FNI&description=&status=0&id_branch=7",
      headers: JSON_HEADERS,
    });
    expect(loadingDuringRequest).toBe(false);
    expect(store.list).toEqual([dni]);
    expect(store.loading).toBe(true);
  });

  test("fetchDataDocument empties the list on rejection and logs a failed request as an error", async () => {
    respond({ listar_documents: rejected() });
    const store = useDocumentStore();
    store.list = [dni];

    await store.fetchDataDocument({ code: "", name: "", description: "", status: 1 });

    expect(store.list).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });

    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    respond({ listar_documents: new Error("network") });
    await store.fetchDataDocument({ code: "", name: "", description: "", status: 1 });
    expect(error).toHaveBeenCalledWith("Error al obtener los datos:", expect.any(Error));
    expect(store.loading).toBe(false);
  });

  test("insertDocument posts the record and reloads the unfiltered list once the user closes the message", async () => {
    respond({ insertar_documents: accepted([]), listar_documents: accepted([dni]) });
    const store = useDocumentStore();

    await store.insertDocument({ name: "CE", status: 1 });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "insertar_documents",
      headers: JSON_HEADERS,
      data: { name: "CE", status: 1 },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(httpMock.mock.calls[1]![0].url).toBe(defaultList);
  });

  test("updateDocument reloads the list only when the backend accepts, and says nothing otherwise", async () => {
    respond({ actualizar_documents: accepted([]), listar_documents: accepted([dni]) });
    const store = useDocumentStore();

    await store.updateDocument({ id: 1, name: "DNI" });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "put",
      url: URL_MAIN + "actualizar_documents",
      headers: JSON_HEADERS,
      data: { id: 1, name: "DNI" },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(httpMock.mock.calls[1]![0].url).toBe(defaultList);

    vi.clearAllMocks();
    respond({ actualizar_documents: rejected("Duplicado") });
    await store.updateDocument({ id: 1, name: "DNI" });
    await flushPromises();
    expect(Swal.fire).not.toHaveBeenCalled();
    expect(httpMock).toHaveBeenCalledTimes(1);
  });

  test("readDocument keeps the first row as the record, or shows the backend message", async () => {
    respond({ ver_documents: accepted([dni]) });
    const store = useDocumentStore();

    await store.readDocument(1);

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "ver_documents?id=1", headers: JSON_HEADERS });
    expect(store.record).toEqual(dni);

    respond({ ver_documents: rejected("No existe") });
    await store.readDocument(9);
    expect(store.record).toEqual(dni);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No existe" });
  });
});

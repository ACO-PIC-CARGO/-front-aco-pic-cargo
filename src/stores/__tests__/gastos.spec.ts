import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useGastosStore } from "@/stores/gastos";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const extra = { id: 4, code: "GEXTR", description: "GASTOS EXTRAS", calculoflag: true, status: true };
const defaultList = URL_MAIN + "listar_gasto?id_branch=7&code=&description=&calculoflag=&status=true";

describe("gastos store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  test("cargarGasto fills the list without touching the loading flag, and empties it on rejection", async () => {
    respond({ cargar_gasto: accepted([extra]) });
    const store = useGastosStore();

    await store.cargarGasto();

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "cargar_gasto?id_branch=7", headers: JSON_HEADERS });
    expect(store.list).toEqual([extra]);
    expect(store.loading).toBe(false);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");

    respond({ cargar_gasto: rejected() });
    await store.cargarGasto();
    expect(store.list).toEqual([]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("fetchDataGasto lists with the encoded code and description and the raw flags, and marks the list loaded", async () => {
    const store = useGastosStore();
    let loadingDuringRequest: boolean | undefined;
    httpMock.mockImplementation(async () => {
      loadingDuringRequest = store.loading;
      return { data: accepted([extra]) };
    });
    store.loading = true;

    await store.fetchDataGasto({ code: "G X", description: "a&b", calculoflag: false, status: "" });

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "listar_gasto?id_branch=7&code=G%20X&description=a%26b&calculoflag=false&status=",
      headers: JSON_HEADERS,
    });
    expect(loadingDuringRequest).toBe(false);
    expect(store.list).toEqual([extra]);
    expect(store.loading).toBe(true);
  });

  test("fetchDataGasto empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_gasto: rejected() });
    const store = useGastosStore();
    store.list = [extra];

    await store.fetchDataGasto({ code: "", description: "", calculoflag: "", status: true });

    expect(store.list).toEqual([]);
    expect(store.loading).toBe(true);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("insertGasto posts the record and reloads the active list once the user closes the message", async () => {
    respond({ insertar_gasto: accepted([]), listar_gasto: accepted([extra]) });
    const store = useGastosStore();

    await store.insertGasto({ code: "GEXTR", description: "GASTOS EXTRAS" });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "insertar_gasto",
      headers: JSON_HEADERS,
      data: { code: "GEXTR", description: "GASTOS EXTRAS" },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(httpMock.mock.calls[1]![0].url).toBe(defaultList);
  });

  test("updateGasto puts the record, shows the backend error and still reloads the active list", async () => {
    respond({ actualizar_gasto: rejected("Duplicado"), listar_gasto: accepted([]) });
    const store = useGastosStore();

    await store.updateGasto({ id: 4, description: "X" });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "put",
      url: URL_MAIN + "actualizar_gasto",
      headers: JSON_HEADERS,
      data: { id: 4, description: "X" },
    });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Duplicado" });
    expect(httpMock.mock.calls[1]![0].url).toBe(defaultList);
  });

  test("readGasto keeps the first row as the record, or shows the backend message", async () => {
    respond({ ver_gasto: accepted([extra]) });
    const store = useGastosStore();

    await store.readGasto(4);

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "ver_gasto?id=4", headers: JSON_HEADERS });
    expect(store.record).toEqual(extra);

    respond({ ver_gasto: rejected("No existe") });
    await store.readGasto(9);
    expect(store.record).toEqual(extra);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No existe" });
  });
});

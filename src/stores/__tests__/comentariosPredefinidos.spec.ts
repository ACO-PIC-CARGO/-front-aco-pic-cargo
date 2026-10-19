import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useComentariosPredefinidosStore } from "@/stores/comentariosPredefinidos";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const comentario = { id: "16", code: "00011", comentario: "EN TRÁNSITO", status: 1, id_branch: 7 };
const listUrl = (query: string) => URL_MAIN + "listarComentariosPredefinidos?" + query;

describe("comentariosPredefinidos store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  test("fetchListadoComentariosPredefinidos lists the active rows by default and flags loading while it runs", async () => {
    const store = useComentariosPredefinidosStore();
    let loadingDuringRequest: boolean | undefined;
    httpMock.mockImplementation(async () => {
      loadingDuringRequest = store.loading;
      return { data: accepted([comentario]) };
    });

    await store.fetchListadoComentariosPredefinidos();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: listUrl("id_branch=7&code=&comentario=&status=1"),
      headers: JSON_HEADERS,
    });
    expect(loadingDuringRequest).toBe(true);
    expect(store.loading).toBe(false);
    expect(store.list).toEqual([comentario]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("fetchListadoComentariosPredefinidos sends the filters as typed and only 0 or 1 as status", async () => {
    respond({ listarComentariosPredefinidos: accepted([]) });
    const store = useComentariosPredefinidosStore();

    await store.fetchListadoComentariosPredefinidos({ code: "0001", comentario: "EN TRÁNSITO", status: 0 });
    await store.fetchListadoComentariosPredefinidos({ code: null, comentario: "", status: "null" });

    expect(httpMock.mock.calls[0]![0].url).toBe(listUrl("id_branch=7&code=0001&comentario=EN TRÁNSITO&status=0"));
    expect(httpMock.mock.calls[1]![0].url).toBe(listUrl("id_branch=7&code=&comentario=&status="));
  });

  test("fetchListadoComentariosPredefinidos empties the list and tells the user when the backend rejects", async () => {
    respond({ listarComentariosPredefinidos: rejected() });
    const store = useComentariosPredefinidosStore();
    store.list = [comentario];

    await store.fetchListadoComentariosPredefinidos();

    expect(store.list).toEqual([]);
    expect(store.loading).toBe(false);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("fetchMaxCodeListadoComentariosPredefinidos keeps the highest code, 0 when empty, and ignores rejections", async () => {
    respond({ consultarMaxCodeComentariosPredefinidos: accepted([{ code: "00011" }]) });
    const store = useComentariosPredefinidosStore();

    await store.fetchMaxCodeListadoComentariosPredefinidos();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "consultarMaxCodeComentariosPredefinidos?id_branch=7",
      headers: JSON_HEADERS,
    });
    expect(store.maxCode).toBe("00011");

    respond({ consultarMaxCodeComentariosPredefinidos: accepted([{ code: null }]) });
    await store.fetchMaxCodeListadoComentariosPredefinidos();
    expect(store.maxCode).toBe(0);

    store.maxCode = "00020";
    respond({ consultarMaxCodeComentariosPredefinidos: rejected() });
    await store.fetchMaxCodeListadoComentariosPredefinidos();
    expect(store.maxCode).toBe("00020");
  });

  test("insertComentarioPredefinido posts the record, shows the answer and reloads the active rows right away", async () => {
    vi.mocked(Swal.fire).mockReturnValue(new Promise(() => {}) as never);
    respond({ insertarComentarioPredefinido: accepted([]), listarComentariosPredefinidos: accepted([comentario]) });
    const store = useComentariosPredefinidosStore();

    await store.insertComentarioPredefinido(comentario);
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "insertarComentarioPredefinido",
      headers: JSON_HEADERS,
      data: comentario,
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok" });
    expect(httpMock.mock.calls[1]![0].url).toBe(listUrl("id_branch=7&code=&comentario=&status=1"));
    expect(store.list).toEqual([comentario]);
  });

  test("updateComentarioPredefinido puts the record and shows the backend error", async () => {
    respond({ actualizarComentarioPredefinido: rejected("Duplicado"), listarComentariosPredefinidos: accepted([]) });
    const store = useComentariosPredefinidosStore();

    await store.updateComentarioPredefinido(comentario);

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "put",
      url: URL_MAIN + "actualizarComentarioPredefinido",
      headers: JSON_HEADERS,
      data: comentario,
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "Duplicado" });
    expect(httpMock.mock.calls[1]![0].url).toBe(listUrl("id_branch=7&code=&comentario=&status=1"));
  });

  test("deleteComentarioPredefinido posts the record to eliminar and reloads the active rows", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    respond({ eliminarComentarioPredefinido: accepted([]), listarComentariosPredefinidos: accepted([]) });
    const store = useComentariosPredefinidosStore();

    await store.deleteComentarioPredefinido(comentario);

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "eliminarComentarioPredefinido",
      headers: JSON_HEADERS,
      data: comentario,
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok" });
    expect(httpMock.mock.calls[1]![0].url).toBe(listUrl("id_branch=7&code=&comentario=&status=1"));
  });
});

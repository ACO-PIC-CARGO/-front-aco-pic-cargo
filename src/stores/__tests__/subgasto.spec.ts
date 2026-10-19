import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useSubgastoStore } from "@/stores/subgasto";
import { JSON_HEADERS, URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const row = { id: "22", id_gasto: 4, code: "CXCV", description: "CUENTAS", status: true, calculoflag: false, mostrarflag: true };

describe("subgasto store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  test("GetListSubGasto reads the current filters, sends 'Todos' as empty and keeps the rows", async () => {
    respond({ listar_subgasto: accepted([row]) });
    const store = useSubgastoStore();

    await store.GetListSubGasto();
    store.filtros = { ...store.filtros, id_gasto: 4, code: "CX", description: "CUENTA", status: "null", calculoflag: false, mostrarflag: true };
    await store.GetListSubGasto();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "get",
      url: URL_MAIN + "listar_subgasto?&id_branch=7&id_gasto=&code=&description=&status=true&calculoflag=&mostrarflag=",
      headers: JSON_HEADERS,
    });
    expect(httpMock.mock.calls[1]![0].url).toBe(
      URL_MAIN + "listar_subgasto?&id_branch=7&id_gasto=4&code=CX&description=CUENTA&status=&calculoflag=false&mostrarflag=true",
    );
    expect(store.lstSubGasto).toEqual([row]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("GetListSubGasto empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_subgasto: rejected() });
    const store = useSubgastoStore();
    store.lstSubGasto = [row];

    await store.GetListSubGasto();

    expect(store.lstSubGasto).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("getValidateCodeSubGasto asks about the model code and returns the answer, or nothing on failure", async () => {
    respond({ validate_code_subgasto: rejected("Código disponible") });
    const store = useSubgastoStore();
    store.model = { ...store.model, code: "NEW" };

    const answer = await store.getValidateCodeSubGasto();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "validate_code_subgasto?id_branch=7&code=NEW",
      headers: JSON_HEADERS,
    });
    expect(answer).toEqual(rejected("Código disponible"));

    vi.spyOn(console, "error").mockImplementation(() => {});
    respond({ validate_code_subgasto: new Error("network") });
    expect(await store.getValidateCodeSubGasto()).toBeUndefined();
  });

  test("setSubGasto posts and ActualizarSubGasto puts the current model, each showing the answer", async () => {
    respond({ insertar_subgasto: accepted([]), actualizar_subgasto: rejected("Duplicado") });
    const store = useSubgastoStore();
    store.model = row;

    await store.setSubGasto();
    await store.ActualizarSubGasto();

    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "post", url: URL_MAIN + "insertar_subgasto", headers: JSON_HEADERS, data: row });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "put", url: URL_MAIN + "actualizar_subgasto", headers: JSON_HEADERS, data: row });
    expect(Swal.fire).toHaveBeenNthCalledWith(1, { icon: "success", text: "ok" });
    expect(Swal.fire).toHaveBeenNthCalledWith(2, { icon: "error", text: "Duplicado" });
  });
});

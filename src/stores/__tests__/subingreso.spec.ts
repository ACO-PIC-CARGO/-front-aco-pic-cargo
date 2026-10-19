import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useSubingresoStore } from "@/stores/subingreso";
import { JSON_HEADERS, URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const row = { id: "22", id_ingreso: 4, code: "CXCV", description: "CUENTAS", status: true, calculoflag: false, mostrarflag: true };

describe("subingreso store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  test("GetListSubIngreso reads the current filters, sends 'Todos' as empty and keeps the rows", async () => {
    respond({ listar_subingreso: accepted([row]) });
    const store = useSubingresoStore();

    await store.GetListSubIngreso();
    store.filtros = { ...store.filtros, id_ingreso: 4, code: "CX", description: "CUENTA", status: "null", calculoflag: false, mostrarflag: true };
    await store.GetListSubIngreso();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "get",
      url: URL_MAIN + "listar_subingreso?&id_branch=7&id_ingreso=&code=&description=&status=true&calculoflag=&mostrarflag=",
      headers: JSON_HEADERS,
    });
    expect(httpMock.mock.calls[1]![0].url).toBe(
      URL_MAIN + "listar_subingreso?&id_branch=7&id_ingreso=4&code=CX&description=CUENTA&status=&calculoflag=false&mostrarflag=true",
    );
    expect(store.lstSubIngreso).toEqual([row]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("GetListSubIngreso empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_subingreso: rejected() });
    const store = useSubingresoStore();
    store.lstSubIngreso = [row];

    await store.GetListSubIngreso();

    expect(store.lstSubIngreso).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("getValidateCodeSubIngreso asks about the model code and returns the answer, or nothing on failure", async () => {
    respond({ validate_code_subingreso: rejected("Código disponible") });
    const store = useSubingresoStore();
    store.model = { ...store.model, code: "NEW" };

    const answer = await store.getValidateCodeSubIngreso();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "validate_code_subingreso?id_branch=7&code=NEW",
      headers: JSON_HEADERS,
    });
    expect(answer).toEqual(rejected("Código disponible"));

    vi.spyOn(console, "error").mockImplementation(() => {});
    respond({ validate_code_subingreso: new Error("network") });
    expect(await store.getValidateCodeSubIngreso()).toBeUndefined();
  });

  test("setSubIngreso posts and ActualizarSubIngreso puts the current model, each showing the answer", async () => {
    respond({ insertar_subingreso: accepted([]), actualizar_subingreso: rejected("Duplicado") });
    const store = useSubingresoStore();
    store.model = row;

    await store.setSubIngreso();
    await store.ActualizarSubIngreso();

    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "post", url: URL_MAIN + "insertar_subingreso", headers: JSON_HEADERS, data: row });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "put", url: URL_MAIN + "actualizar_subingreso", headers: JSON_HEADERS, data: row });
    expect(Swal.fire).toHaveBeenNthCalledWith(1, { icon: "success", text: "ok" });
    expect(Swal.fire).toHaveBeenNthCalledWith(2, { icon: "error", text: "Duplicado" });
  });
});

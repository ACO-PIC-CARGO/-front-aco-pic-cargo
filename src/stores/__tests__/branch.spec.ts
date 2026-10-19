import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useBranchStore } from "@/stores/branch";
import { useCityStore } from "@/stores/city";
import { JSON_HEADERS, URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const row = { id: 3, trade_name: "PIC", status: 1 };

describe("branch store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  test("ListadoSucursal keeps the rows and the new token when the backend accepts", async () => {
    respond({ listar_sucursal: accepted([row]) });
    const store = useBranchStore();

    await store.ListadoSucursal();

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "listar_sucursal", headers: JSON_HEADERS });
    expect(store.lstBranch).toEqual([row]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("ListadoSucursal empties the city list, keeps the branch list and tells the user when the backend rejects", async () => {
    respond({ listar_sucursal: rejected() });
    const store = useBranchStore();
    store.lstBranch = [row];
    const city = useCityStore();
    city.lstCity = [{ id: 1 }] as never;

    await store.ListadoSucursal();

    expect(city.lstCity).toEqual([]);
    expect(store.lstBranch).toEqual([row]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("ListadoSucursal logs a failed request and keeps the list", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    respond({ listar_sucursal: new Error("network") });
    const store = useBranchStore();
    store.lstBranch = [row];

    await store.ListadoSucursal();

    expect(store.lstBranch).toEqual([row]);
    expect(consoleError).toHaveBeenCalled();
  });

  test("inactivarSucursal sends the id and shows the answer as an info message, or an error on 401", async () => {
    respond({ inactivar_sucursal: accepted([]) });
    const store = useBranchStore();

    await store.inactivarSucursal(3);

    expect(httpMock).toHaveBeenCalledWith({ method: "put", url: URL_MAIN + "inactivar_sucursal", data: { id: 3 }, headers: JSON_HEADERS });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "ok" });

    respond({ inactivar_sucursal: rejected("Sesión vencida", "401") });
    await store.inactivarSucursal(3);
    expect(vi.mocked(Swal.fire).mock.calls[1]![0]).toMatchObject({ icon: "error", text: "Sesión vencida" });
  });
});

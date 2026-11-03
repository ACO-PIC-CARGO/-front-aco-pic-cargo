import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useBranchStore } from "@/stores/branch";
import { useCityStore } from "@/stores/city";
import { JSON_HEADERS, URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";

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

  test("ListadoSucursal keeps the rows when the backend accepts", async () => {
    respond({ listar_sucursal: accepted([row]) });
    const store = useBranchStore();

    await store.ListadoSucursal();

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "listar_sucursal", headers: JSON_HEADERS });
    expect(store.lstBranch).toEqual([row]);
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

  test("ListadoSucursal keeps the list and tells the user when the server cannot be reached", async () => {
    respond({ listar_sucursal: new Error("network") });
    const store = useBranchStore();
    store.lstBranch = [row];

    await store.ListadoSucursal();

    expect(store.lstBranch).toEqual([row]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ text: CONNECTION_ERROR_MESSAGE });
  });

  test("inactivarSucursal sends the company, says it was inactivated and reports success", async () => {
    respond({ inactivar_sucursal: accepted([]) });

    const done = await useBranchStore().inactivarSucursal(3);

    expect(httpMock).toHaveBeenCalledWith({ method: "put", url: URL_MAIN + "inactivar_sucursal", data: { id: 3 }, headers: JSON_HEADERS });
    expect(done).toBe(true);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "success", text: "ok" });
  });

  test("inactivarSucursal shows why a company was not inactivated", async () => {
    respond({ inactivar_sucursal: { ...rejected("La empresa de ACO no se puede inactivar."), tipomensaje: "TMSGADV" } });

    const done = await useBranchStore().inactivarSucursal(2);

    expect(done).toBe(false);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({
      icon: "error",
      text: "La empresa de ACO no se puede inactivar.",
    });
  });

  test("reactivarSucursal sends the company and reports success", async () => {
    respond({ reactivar_sucursal: accepted([]) });

    const done = await useBranchStore().reactivarSucursal(3);

    expect(httpMock).toHaveBeenCalledWith({ method: "put", url: URL_MAIN + "reactivar_sucursal", data: { id: 3 }, headers: JSON_HEADERS });
    expect(done).toBe(true);
  });

  const admin = { usuario: "admin@example.com", clave: "Clave-1" };

  test("eliminarSucursal sends the company with the administrator's credentials and reports success", async () => {
    respond({ eliminar_sucursal: accepted([]) });

    const done = await useBranchStore().eliminarSucursal(3, admin);

    expect(httpMock).toHaveBeenCalledWith({
      method: "delete",
      url: URL_MAIN + "eliminar_sucursal",
      data: { id: 3, ...admin },
      headers: JSON_HEADERS,
    });
    expect(done).toBe(true);
  });

  test("eliminarSucursal shows why a company was not deleted", async () => {
    respond({ eliminar_sucursal: { ...rejected("Inactiva la empresa antes de eliminarla."), tipomensaje: "TMSGADV" } });

    const done = await useBranchStore().eliminarSucursal(3, admin);

    expect(done).toBe(false);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({
      icon: "error",
      text: "Inactiva la empresa antes de eliminarla.",
    });
  });
});

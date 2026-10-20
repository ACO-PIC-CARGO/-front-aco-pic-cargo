import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import http from "@/api/http";
import router from "@/router";
import { useHousesStore } from "@/stores/houses";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { get: vi.fn(), put: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { name: "somewhere" } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const getMock = http.get as unknown as Mock<(url: string, config: unknown) => Promise<{ data: unknown }>>;
const putMock = http.put as unknown as Mock<(url: string, data: unknown, config: unknown) => Promise<{ data: unknown }>>;
const currentRoute = router.currentRoute as unknown as { value: { name: string } };

const firstSwal = () => vi.mocked(Swal.fire).mock.calls[0]![0];

describe("houses store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    currentRoute.value.name = "somewhere";
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test("verHouse stamps the branch on the filters and keeps the first row", async () => {
    getMock.mockResolvedValue({ data: { data: [{ id: 5, code_house: "H-5" }, { id: 6 }] } });
    const houses = useHousesStore();
    const filtros: Record<string, unknown> = { id: 5 };

    await houses.verHouse(filtros);

    expect(filtros.id_branch).toBe(7);
    expect(getMock).toHaveBeenCalledWith(URL_MAIN + "house_ver", { params: { id: 5, id_branch: 7 }, "Content-Type": "application/json" });
    expect(houses.house).toEqual({ id: 5, code_house: "H-5" });
  });

  test("verHouse empties the house when the answer carries no rows", async () => {
    getMock.mockResolvedValue({ data: {} });
    const houses = useHousesStore();
    houses.house = { id: 1 };

    await houses.verHouse({ id: 1 });

    expect(houses.house).toEqual({});
  });

  test("verHouse keeps the house when the request fails", async () => {
    getMock.mockRejectedValue(new Error("network"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const houses = useHousesStore();
    houses.house = { id: 1 };

    await houses.verHouse({ id: 1 });

    expect(houses.house).toEqual({ id: 1 });
  });

  test("listarHouse stamps the branch and keeps the rows, or empties the list without rows", async () => {
    const houses = useHousesStore();
    getMock.mockResolvedValueOnce({ data: { data: [{ id: 1 }, { id: 2 }] } });
    await houses.listarHouse({ code: "H" });
    expect(getMock).toHaveBeenCalledWith(URL_MAIN + "listado_houses", { params: { code: "H", id_branch: 7 }, "Content-Type": "application/json" });
    expect(houses.listHouse).toEqual([{ id: 1 }, { id: 2 }]);

    getMock.mockResolvedValueOnce({ data: {} });
    await houses.listarHouse({});
    expect(houses.listHouse).toEqual([]);
  });

  test("getCargarHouse asks for the houses of the session branch", async () => {
    httpMock.mockResolvedValue({ data: { data: [{ id: 3 }] } });
    const houses = useHousesStore();

    await houses.getCargarHouse();

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "cargar_house?id_branch=7", headers: JSON_HEADERS });
    expect(houses.listHouse).toEqual([{ id: 3 }]);
  });

  test("getFacturasFiscales clears the list first and keeps the rows only when the first one is accepted", async () => {
    const houses = useHousesStore();
    houses.lstFacturasFiscales = [{ estadoflag: true }];
    let during: unknown;
    httpMock.mockImplementation(async () => {
      during = houses.lstFacturasFiscales;
      return { data: { token: "tok-1", data: [{ estadoflag: true, originalname: "f.pdf" }] } };
    });

    await houses.getFacturasFiscales({ id_house: 4, id_correlativo: 9 });

    expect(during).toEqual([]);
    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "getFacturasFiscales",
      params: { id_house: 4, id_correlativo: 9 },
      headers: JSON_HEADERS,
    });
    expect(sessionStorage.getItem("auth-token")).toBe("tok-1");
    expect(houses.lstFacturasFiscales).toEqual([{ estadoflag: true, originalname: "f.pdf" }]);

    httpMock.mockResolvedValue({ data: { token: "tok-2", data: [{ estadoflag: false }] } });
    await houses.getFacturasFiscales({ id_house: 4 });
    expect(houses.lstFacturasFiscales).toEqual([]);
  });

  test("getFacturasFiscales leaves the list empty when the answer has no rows", async () => {
    httpMock.mockResolvedValue({ data: { token: "t", data: [] } });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const houses = useHousesStore();
    houses.lstFacturasFiscales = [{ estadoflag: true }];

    await houses.getFacturasFiscales();

    expect(houses.lstFacturasFiscales).toEqual([]);
  });

  test("setConfirmarTelex thanks the user only when the backend accepts", async () => {
    const houses = useHousesStore();
    putMock.mockResolvedValueOnce({ data: { estadoflag: true, mensaje: "Telex confirmado" } });
    await houses.setConfirmarTelex({ id: 3 });
    expect(putMock).toHaveBeenCalledWith(URL_MAIN + "houses_confirmar_telex", { id: 3 }, { "Content-Type": "application/json" });
    expect(firstSwal()).toEqual({ icon: "success", text: "Telex confirmado" });

    vi.mocked(Swal.fire).mockClear();
    putMock.mockResolvedValueOnce({ data: { estadoflag: false, mensaje: "no" } });
    await houses.setConfirmarTelex({ id: 3 });
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("guardarCarpetaHouse sends the folder data with a PUT", async () => {
    respond({ "crear-carpeta-house": accepted([]) });
    vi.spyOn(console, "log").mockImplementation(() => {});
    const houses = useHousesStore();

    await houses.guardarCarpetaHouse({ id: 1 });
    await flushPromises();

    expect(httpMock).toHaveBeenCalledWith({
      method: "put",
      url: URL_MAIN + "crear-carpeta-house",
      headers: JSON_HEADERS,
      data: { id: 1 },
    });
  });

  test("insertComentarioHouse saves the token and shows the answer with its own icon", async () => {
    const houses = useHousesStore();
    respond({ insertComentarioHouse: { ...accepted([]), token: "tok-c" } });
    await houses.insertComentarioHouse({ comentario: "hola" });
    expect(httpMock).toHaveBeenCalledWith({
      method: "post",
      url: URL_MAIN + "insertComentarioHouse",
      headers: JSON_HEADERS,
      data: { comentario: "hola" },
    });
    expect(sessionStorage.getItem("auth-token")).toBe("tok-c");
    expect(firstSwal()).toEqual({ icon: "success", text: "ok" });

    vi.mocked(Swal.fire).mockClear();
    respond({ insertComentarioHouse: rejected("No se pudo") });
    await houses.insertComentarioHouse();
    expect(firstSwal()).toEqual({ icon: "error", text: "No se pudo" });
  });

  test("insertComentarioHouse sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ insertComentarioHouse: { token: "t", status: "401", mensaje: "Token vencido" } });
    const houses = useHousesStore();

    await houses.insertComentarioHouse({});
    await flushPromises();

    expect(firstSwal()).toMatchObject({ icon: "error", text: "Token vencido", allowOutsideClick: false, allowEscapeKey: false, allowEnterKey: false });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("insertComentarioHouse logs a failed request and shows nothing", async () => {
    respond({ insertComentarioHouse: new Error("network") });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const houses = useHousesStore();

    await houses.insertComentarioHouse({});

    expect(log).toHaveBeenCalledTimes(1);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("deleteHouse saves the token and sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ setHouseDelete: { token: "t-d", status: "401", mensaje: "Token vencido" } });
    const houses = useHousesStore();

    await houses.deleteHouse({ id: 1 });
    await flushPromises();

    expect(httpMock).toHaveBeenCalledWith({ method: "put", url: URL_MAIN + "setHouseDelete", headers: JSON_HEADERS, data: { id: 1 } });
    expect(sessionStorage.getItem("auth-token")).toBe("t-d");
    expect(firstSwal()).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("deleteHouse goes back to the master of the copied house after deleting from the house editor", async () => {
    respond({ setHouseDelete: { token: "t", statusBol: true } });
    currentRoute.value.name = "controlHouseEditar";
    vi.spyOn(console, "log").mockImplementation(() => {});
    const houses = useHousesStore();
    houses.copy_house = { id_master: 12 } as never;

    await houses.deleteHouse({ id: 1 });
    await flushPromises();

    expect(firstSwal()).toEqual({
      icon: "success",
      title: "REGISTRO ELIMINADO.",
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    });
    expect(router.push).toHaveBeenCalledWith({ name: "controlMasterEditar", params: { id: 12 } });
  });

  test("deleteHouse reloads the page after deleting from the master editor and stays put elsewhere", async () => {
    respond({ setHouseDelete: { token: "t", statusBol: true } });
    const reload = vi.fn();
    vi.stubGlobal("location", { reload });
    vi.spyOn(console, "log").mockImplementation(() => {});
    const houses = useHousesStore();

    currentRoute.value.name = "controlMasterEditar";
    await houses.deleteHouse({ id: 1 });
    await flushPromises();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();

    currentRoute.value.name = "listHouse";
    await houses.deleteHouse({ id: 1 });
    await flushPromises();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
  });

  test("deleteHouse does not navigate when the success message is dismissed", async () => {
    respond({ setHouseDelete: { token: "t", statusBol: true } });
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
    currentRoute.value.name = "controlHouseEditar";
    vi.spyOn(console, "log").mockImplementation(() => {});
    const houses = useHousesStore();

    await houses.deleteHouse({ id: 1 });
    await flushPromises();

    expect(router.push).not.toHaveBeenCalled();
  });
});

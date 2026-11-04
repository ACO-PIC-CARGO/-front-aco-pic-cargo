import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import http from "@/api/http";
import router from "@/router";
import { useHousesStore } from "@/stores/houses";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { put: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { name: "somewhere" } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

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

  test("verHouse keeps the first row of the house the server returns", async () => {
    respond({ house_ver: accepted([{ id: 5, code_house: "H-5" }, { id: 6 }]) });
    const houses = useHousesStore();

    await houses.verHouse({ id: 5 });

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "house_ver", params: { id: 5 } });
    expect(houses.house).toEqual({ id: 5, code_house: "H-5" });
  });

  test("verHouse empties the house when the server refuses it", async () => {
    respond({ house_ver: rejected("No encontramos ese expediente. Recarga la página e intenta de nuevo.") });
    const houses = useHousesStore();
    houses.house = { id: 1 };

    await houses.verHouse({ id: 1 });

    expect(houses.house).toEqual({});
  });

  test("verHouse keeps the house when the request fails", async () => {
    respond({ house_ver: new Error("network") });
    const houses = useHousesStore();
    houses.house = { id: 1 };

    await houses.verHouse({ id: 1 });

    expect(houses.house).toEqual({ id: 1 });
  });

  test("listarHouse sends the filters the list reads and keeps the rows", async () => {
    respond({ listado_houses: accepted([{ id: 1 }, { id: 2 }]) });
    const houses = useHousesStore();

    await houses.listarHouse({ ...houses.house_filtro, id_sentido: 1, id_tipo_embarque: { id: 3 } } as never);

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "listado_houses",
      params: { id_modality: 1, id_shipment: 3 },
    });
    expect(houses.listHouse).toEqual([{ id: 1 }, { id: 2 }]);
  });

  test("listarHouse shows an empty list when nothing matches, and says so only when the request fails", async () => {
    const houses = useHousesStore();
    houses.listHouse = [{ id: 1 }] as never;
    respond({ listado_houses: rejected() });
    await houses.listarHouse(houses.house_filtro);
    expect(houses.listHouse).toEqual([]);
    expect(Swal.fire).not.toHaveBeenCalled();

    respond({ listado_houses: new Error("network") });
    await houses.listarHouse(houses.house_filtro);
    expect(houses.listHouse).toEqual([]);
    expect(firstSwal()).toMatchObject({ icon: "error" });
  });

  test("getCargarHouse asks for the houses of the session branch", async () => {
    httpMock.mockResolvedValue({ data: { data: [{ id: 3 }] } });
    const houses = useHousesStore();

    await houses.getCargarHouse();

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "cargar_house?id_branch=7", headers: JSON_HEADERS });
    expect(houses.listHouse).toEqual([{ id: 3 }]);
  });

  test("getFacturasFiscales clears the list first and keeps the rows only when the answer is accepted", async () => {
    const houses = useHousesStore();
    houses.lstFacturasFiscales = [{ estadoflag: true }];
    let during: unknown;
    httpMock.mockImplementation(async () => {
      during = houses.lstFacturasFiscales;
      return { data: { token: "tok-1", estadoflag: true, data: [{ estadoflag: true, originalname: "f.pdf" }] } };
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

    httpMock.mockResolvedValue({ data: { token: "tok-2", estadoflag: false, data: [] } });
    await houses.getFacturasFiscales({ id_house: 4 });
    expect(houses.lstFacturasFiscales).toEqual([]);
  });

  test("getFacturasFiscales leaves the list empty without an error when the house has no fiscal invoices", async () => {
    httpMock.mockResolvedValue({ data: { token: "t", estadoflag: false, mensaje: "No se encontraron registros", data: [] } });
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const houses = useHousesStore();
    houses.lstFacturasFiscales = [{ estadoflag: true }];

    await houses.getFacturasFiscales();

    expect(houses.lstFacturasFiscales).toEqual([]);
    expect(logged).not.toHaveBeenCalled();
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

  test("deleteHouse explains why the server refused and stays on the house", async () => {
    const reason = "No podemos eliminar este house porque ya tiene pagos registrados. Anula esos pagos primero e intenta de nuevo.";
    respond({ setHouseDelete: { ...rejected(reason), tipomensaje: "TMSGADV" } });
    currentRoute.value.name = "controlHouseVer";
    const houses = useHousesStore();

    expect(await houses.deleteHouse({ id: 1 })).toBe(false);

    expect(httpMock).toHaveBeenCalledWith({ method: "put", url: URL_MAIN + "setHouseDelete", data: { id: 1 } });
    expect(firstSwal()).toMatchObject({ icon: "warning", text: reason });
    expect(router.push).not.toHaveBeenCalled();
  });

  test("deleteHouse goes to the house's master after deleting from the house screen", async () => {
    respond({ setHouseDelete: { ...accepted([]), mensaje: "Eliminamos el house." } });
    const houses = useHousesStore();
    houses.house = { id: 1, id_master: 12 };

    for (const name of ["controlHouseEditar", "controlHouseVer"]) {
      vi.mocked(router.push).mockClear();
      currentRoute.value.name = name;
      expect(await houses.deleteHouse({ id: 1 })).toBe(true);
      await flushPromises();
      expect(router.push).toHaveBeenCalledWith({ name: "controlMasterEditar", params: { id: 12 } });
    }
    expect(firstSwal()).toMatchObject({ icon: "success", text: "Eliminamos el house." });
  });

  test("deleteHouse reloads the page after deleting from the master editor", async () => {
    respond({ setHouseDelete: accepted([]) });
    const reload = vi.fn();
    vi.stubGlobal("location", { reload });
    currentRoute.value.name = "controlMasterEditar";
    const houses = useHousesStore();

    await houses.deleteHouse({ id: 1 });
    await flushPromises();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
  });
});

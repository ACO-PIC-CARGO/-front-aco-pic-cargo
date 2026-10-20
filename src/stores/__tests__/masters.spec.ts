import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useMastersStore } from "@/stores/masters";
import { JSON_HEADERS, URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

describe("masters store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  test("createCarpetaOneDrive returns the folder url the backend answers", async () => {
    respond({ "crear-carpeta-master": { data: "https://drive/m1" } });
    const masters = useMastersStore();

    const url = await masters.createCarpetaOneDrive({ name: "M-1" });

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "crear-carpeta-master?nromaster=M-1",
      headers: JSON_HEADERS,
    });
    expect(url).toBe("https://drive/m1");
  });

  test("createCarpetaOneDrive asks with an empty name by default and returns false when the request fails", async () => {
    respond({ "crear-carpeta-master": new Error("network") });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const masters = useMastersStore();

    const url = await masters.createCarpetaOneDrive({});

    expect(httpMock.mock.calls[0]![0].url).toBe(URL_MAIN + "crear-carpeta-master?nromaster=");
    expect(url).toBe(false);
    expect(log).toHaveBeenCalledTimes(1);
  });

  test("actualizarMaster and actualizarURLEnElMaster send the folder url with defaults", async () => {
    respond({ update_folder_onedrive: { data: [] }, actualizar_folder_onedrive_master: { data: [] } });
    vi.spyOn(console, "log").mockImplementation(() => {});
    const masters = useMastersStore();

    await masters.actualizarMaster({ id: 4, url: "https://drive/a" });
    await masters.actualizarMaster({});
    await masters.actualizarURLEnElMaster({ id: "9", url: "https://drive/b" });
    await masters.actualizarURLEnElMaster({});

    expect(httpMock.mock.calls.map(([config]) => [config.method, config.url.slice(URL_MAIN.length), config.data])).toEqual([
      ["put", "update_folder_onedrive", { id: 4, url: "https://drive/a" }],
      ["put", "update_folder_onedrive", { id: 0, url: "" }],
      ["put", "actualizar_folder_onedrive_master", { id: "9", url: "https://drive/b" }],
      ["put", "actualizar_folder_onedrive_master", { id: "", url: "" }],
    ]);
  });

  test("moverCostos and controlGastosReactivar send the data and swallow a failed request", async () => {
    respond({ mover_cgegresos: new Error("a"), master_control_reactivar: new Error("b") });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const masters = useMastersStore();

    await masters.moverCostos({ id: 1 });
    await masters.controlGastosReactivar({ id: 2 });

    expect(httpMock.mock.calls.map(([config]) => [config.method, config.url.slice(URL_MAIN.length), config.data])).toEqual([
      ["put", "mover_cgegresos", { id: 1 }],
      ["put", "master_control_reactivar", { id: 2 }],
    ]);
    expect(log).toHaveBeenCalledTimes(2);
  });

  test("insertComentarioMaster posts the comment, saves the token and shows the answer with its own icon", async () => {
    const masters = useMastersStore();
    respond({ insert_comentario_master: { ...accepted([]), token: "tok-m" } });
    await masters.insertComentarioMaster({ id_entitie: 2, id_master: 3, fecha: "2026-01-01", comentario: "hola" });
    expect(httpMock).toHaveBeenCalledWith({
      method: "post",
      url: URL_MAIN + "insert_comentario_master",
      headers: JSON_HEADERS,
      data: { id_entitie: 2, id_master: 3, fecha: "2026-01-01", comentario: "hola" },
    });
    expect(sessionStorage.getItem("auth-token")).toBe("tok-m");
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toEqual({ icon: "success", text: "ok" });

    vi.mocked(Swal.fire).mockClear();
    respond({ insert_comentario_master: rejected("No se pudo") });
    await masters.insertComentarioMaster({});
    expect(httpMock.mock.calls[httpMock.mock.calls.length - 1]![0].data).toEqual({ id_entitie: 0, id_master: 0, fecha: 0, comentario: 0 });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toEqual({ icon: "error", text: "No se pudo" });
  });

  test("insertComentarioMaster blocks the screen with the message when the session expired", async () => {
    respond({ insert_comentario_master: { token: "t", status: "401", mensaje: "Token vencido" } });
    const masters = useMastersStore();

    await masters.insertComentarioMaster({});

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toEqual({
      icon: "error",
      text: "Token vencido",
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
    });
  });
});

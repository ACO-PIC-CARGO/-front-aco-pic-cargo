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

  test("createCarpetaOneDrive asks for the master folder by master id and returns its url", async () => {
    respond({ "crear-carpeta-master": accepted("https://drive/m1") });
    const masters = useMastersStore();

    const url = await masters.createCarpetaOneDrive({ id_master: 4 });

    expect(httpMock.mock.calls[0]![0]).toMatchObject({ method: "get", url: URL_MAIN + "crear-carpeta-master?id_master=4" });
    expect(url).toBe("https://drive/m1");
  });

  test("createCarpetaOneDrive returns false when the folder is refused or the request fails", async () => {
    const masters = useMastersStore();
    respond({ "crear-carpeta-master": rejected("No se encontraron registros") });
    expect(await masters.createCarpetaOneDrive({ id_master: 4 })).toBe(false);

    respond({ "crear-carpeta-master": new Error("network") });
    expect(await masters.createCarpetaOneDrive({ id_master: 4 })).toBe(false);
  });

  test("saving a master folder returns the answer so the screen can tell what happened", async () => {
    const refused = { estadoflag: false, mensaje: "Esa carpeta no es de OneDrive de tu empresa.", tipomensaje: "TMSGADV", data: [] };
    respond({ update_folder_onedrive: accepted([]), actualizar_folder_onedrive_master: refused });
    const masters = useMastersStore();

    expect((await masters.actualizarMaster({ id: 4, url: "https://drive/a" })).estadoflag).toBe(true);
    expect(await masters.actualizarURLEnElMaster({ id: 9, url: "https://evil" })).toMatchObject({ estadoflag: false, mensaje: refused.mensaje });
    expect(httpMock.mock.calls.map(([config]) => [config.method, config.url.slice(URL_MAIN.length), config.data])).toEqual([
      ["put", "update_folder_onedrive", { id: 4, url: "https://drive/a" }],
      ["put", "actualizar_folder_onedrive_master", { id: 9, url: "https://evil" }],
    ]);
  });

  test("saving a master folder without connection answers a friendly message", async () => {
    respond({ actualizar_folder_onedrive_master: new Error("Network Error") });

    const answer = await useMastersStore().actualizarURLEnElMaster({ id: 9, url: "https://drive/b" });

    expect(answer.estadoflag).toBe(false);
    expect(answer.mensaje).toContain("Revisa tu conexión");
  });

  test("moverCostos swallows a failed request and controlGastosReactivar returns the answer", async () => {
    respond({ mover_cgegresos: new Error("a"), master_control_reactivar: rejected("No se encontraron registros") });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const masters = useMastersStore();

    await masters.moverCostos({ id: 1 });
    const answer = await masters.controlGastosReactivar({ id: 2 });

    expect(httpMock.mock.calls.map(([config]) => [config.method, config.url.slice(URL_MAIN.length), config.data])).toEqual([
      ["put", "mover_cgegresos", { id: 1 }],
      ["put", "master_control_reactivar", { id: 2 }],
    ]);
    expect(answer).toMatchObject({ estadoflag: false, mensaje: "No se encontraron registros" });
  });

  test("CambiarExpedienteAsociadoAMaster tells the user when moving an expense is not available", async () => {
    respond({ cambiar_expediente_asociado_a_master: rejected("Todavía no está disponible.") });

    await useMastersStore().CambiarExpedienteAsociadoAMaster({ id_master: 1 });

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "Todavía no está disponible." });
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

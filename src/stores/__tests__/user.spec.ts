import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useUserStore } from "@/stores/user";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const row = { id: 4, nombrecompleto: "Ana Pérez", users: "ana", phone: "999", status: 1 };

describe("user store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  test("GetListUsers reads the current filters, sends 'Todos' as empty and keeps the rows", async () => {
    respond({ listar_usuarios: accepted([row]) });
    const store = useUserStore();

    await store.GetListUsers();
    store.filtros = { ...store.filtros, users: "an", nombrecompleto: "Ana", id_document: 2, document: "123", phone: "9", email: "a@b.c", status: "null" };
    await store.GetListUsers();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "get",
      url: URL_MAIN + "listar_usuarios?&id_branch=7&users=&nombrecompleto=&id_document=&document=&phone=&email=&status=1",
      headers: JSON_HEADERS,
    });
    expect(httpMock.mock.calls[1]![0].url).toBe(
      URL_MAIN + "listar_usuarios?&id_branch=7&users=an&nombrecompleto=Ana&id_document=2&document=123&phone=9&email=a@b.c&status=",
    );
    expect(store.lstUsers).toEqual([row]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("GetListUsers empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_usuarios: rejected() });
    const store = useUserStore();
    store.lstUsers = [row];

    await store.GetListUsers();

    expect(store.lstUsers).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("GetVerUsers loads the model with its positions and branches, or warns when the backend rejects", async () => {
    const detail = { id: 4, users: "ana", positions: [{ id: 1, name: "ADM" }], sucursales: [{ id: 2, trade_name: "PIC" }] };
    respond({ ver_usuario: accepted([detail]) });
    const store = useUserStore();
    store.model.id = 4;

    await store.GetVerUsers();

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "ver_usuario?&id_branch=7&id=4", headers: JSON_HEADERS });
    expect(store.model).toEqual(detail);
    expect(store.positions).toEqual(detail.positions);
    expect(store.sucursales).toEqual(detail.sucursales);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");

    respond({ ver_usuario: rejected("Usuario inexistente") });
    await store.GetVerUsers();
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "warning", title: "Aviso", text: "Usuario inexistente" });
  });

  test("the validators ask about the model and return the answer, or nothing on failure", async () => {
    respond({
      validate_user_usuarios: rejected("Libre"),
      validate_email_usuarios: rejected("Libre"),
      validate_document_usuarios: rejected("Libre"),
    });
    const store = useUserStore();
    store.model = { users: "ana", email: "a@b.c", id_document: 2, document: "123" };

    expect(await store.validateUserUsuario()).toEqual(rejected("Libre"));
    expect(await store.validateEmailUsuario()).toEqual(rejected("Libre"));
    expect(await store.validateDocumentUsuario()).toEqual(rejected("Libre"));

    expect(httpMock.mock.calls.map(([config]) => config.url)).toEqual([
      URL_MAIN + "validate_user_usuarios?users=ana",
      URL_MAIN + "validate_email_usuarios?email=a@b.c",
      URL_MAIN + "validate_document_usuarios?id_branch=7&id_document=2&document=123",
    ]);

    vi.spyOn(console, "error").mockImplementation(() => {});
    respond({ validate_user_usuarios: new Error("network") });
    expect(await store.validateUserUsuario()).toBeUndefined();
  });

  test("setUsers and ActualizarUsers send the model with branch, positions and branches, then go back to the list", async () => {
    respond({ insertar_usuario: accepted([]), actualizar_usuario: rejected("Duplicado") });
    const store = useUserStore();
    store.model = { users: "ana" };
    store.positions = [{ id: 1, name: "ADM" }];
    store.sucursales = [{ id: 2, trade_name: "PIC" }];
    const body = { users: "ana", id_branch: 7, positions: store.positions, sucursales: store.sucursales };

    await store.setUsers();
    await store.ActualizarUsers();
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "post", url: URL_MAIN + "insertar_usuario", headers: JSON_HEADERS, data: body });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "put", url: URL_MAIN + "actualizar_usuario", headers: JSON_HEADERS, data: body });
    expect(Swal.fire).toHaveBeenNthCalledWith(1, {
      icon: "success",
      text: "ok",
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    });
    expect(vi.mocked(Swal.fire).mock.calls[1]![0]).toMatchObject({ icon: "error", text: "Duplicado" });
    expect(router.push).toHaveBeenCalledTimes(2);
    expect(router.push).toHaveBeenCalledWith({ name: "listUser" });
  });

  test("cambiarEstadoUsers sends the model and shows the answer without going anywhere", async () => {
    respond({ cambiar_estado_usuario: accepted([]) });
    const store = useUserStore();
    store.model = { id: 4, status: 0 };

    await store.cambiarEstadoUsers();

    expect(httpMock).toHaveBeenCalledWith({ method: "put", url: URL_MAIN + "cambiar_estado_usuario", headers: JSON_HEADERS, data: { id: 4, status: 0 } });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", allowEnterKey: false, allowEscapeKey: false, allowOutsideClick: false });
    expect(router.push).not.toHaveBeenCalled();
  });
});

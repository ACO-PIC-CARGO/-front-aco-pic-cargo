import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useRolesStore } from "@/stores/roles";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";
import { JSON_HEADERS, URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) } }));

const role = { id: 5, code: "E5", name: "Ventas", description: "Equipo comercial", estado: true, system: false, editable: true, users: 2 };
const catalogScreen = (menu_id: number, granted: string[]) => ({
  module_id: 1,
  module: "SEGURIDAD",
  module_order: 1,
  group_id: 12,
  group_name: "EMPRESA Y USUARIO",
  menu_id,
  route: `route${menu_id}`,
  screen: `Pantalla ${menu_id}`,
  actions: ["VER", "NUEVO"].map((name, id) => ({ id, code: `0${id}`, name, granted: granted.includes(name), grantable: true })),
});
const refused = (mensaje: string) => ({ ...rejected(mensaje), tipomensaje: "TMSGADV" });
const swalText = () => vi.mocked(Swal.fire).mock.calls.map(([options]) => (options as { text?: string }).text);

describe("roles store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  test("fetchRoles sends the search and estado filters and keeps the rows and the renewed token", async () => {
    respond({ roles: accepted([role]) });
    const store = useRolesStore();

    await store.fetchRoles({ search: "ven", estado: true });

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "roles",
      headers: JSON_HEADERS,
      params: { search: "ven", estado: true },
    });
    expect(store.roles).toEqual([role]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("fetchRoles empties the list without an alert when nothing matches", async () => {
    respond({ roles: rejected() });
    const store = useRolesStore();
    store.roles = [role];

    await store.fetchRoles({ search: "", estado: "" });

    expect(store.roles).toEqual([]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("fetchRoles explains a refused or failed request", async () => {
    const store = useRolesStore();
    respond({ roles: refused("No tienes permiso para esta acción. Pide a un administrador de tu empresa que te lo asigne.") });
    await store.fetchRoles({ search: "", estado: "" });
    respond({ roles: new Error("Network Error") });
    await store.fetchRoles({ search: "", estado: "" });

    expect(swalText()).toEqual([
      "No tienes permiso para esta acción. Pide a un administrador de tu empresa que te lo asigne.",
      CONNECTION_ERROR_MESSAGE,
    ]);
  });

  test("fetchRoleOptions keeps the roles the user may assign", async () => {
    const option = { id: 5, name: "Ventas", description: null };
    respond({ "roles/options": accepted([option]) });
    const store = useRolesStore();

    await store.fetchRoleOptions();

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "roles/options", headers: JSON_HEADERS });
    expect(store.options).toEqual([option]);
  });

  test("fetchRole keeps the role with its users, and clears it when the role is not visible", async () => {
    const detail = { ...role, users: [{ id: 4, users: "ana", nombrecompleto: "Ana Díaz", assigned: true }] };
    respond({ "roles/5": accepted(detail) });
    const store = useRolesStore();

    await store.fetchRole(5);
    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "roles/5", headers: JSON_HEADERS });
    expect(store.role).toEqual(detail);

    respond({ "roles/5": rejected() });
    await store.fetchRole(5);
    expect(store.role).toBeNull();
  });

  test("fetchCatalog asks for the grants of the role being edited, or of no role for a new one", async () => {
    respond({ "permissions/catalog": accepted([catalogScreen(7, ["VER"])]) });
    const store = useRolesStore();

    await store.fetchCatalog(5);
    await store.fetchCatalog(null);

    expect(httpMock.mock.calls.map(([config]) => config.params)).toEqual([{ role_id: 5 }, { role_id: "" }]);
    expect(store.catalog).toEqual([catalogScreen(7, ["VER"])]);
  });

  test("fetchPermissionList keeps every screen and action with its roles", async () => {
    const row = { module: "SEGURIDAD", group_name: "G", menu_id: 7, route: "r", screen: "S", action: "VER", roles: [{ id: 5, name: "Ventas" }] };
    respond({ "permissions/list": accepted([row]) });
    const store = useRolesStore();

    await store.fetchPermissionList();

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "permissions/list", headers: JSON_HEADERS });
    expect(store.permissionList).toEqual([row]);
  });

  test("saveRole posts a new role and returns its id", async () => {
    respond({ roles: accepted({ id: 9 }) });
    const store = useRolesStore();
    const form = { name: "Ventas", description: "", estado: true, permissions: [{ menu_id: 7, actions: ["VER"] }] };

    expect(await store.saveRole(null, form)).toBe(9);
    expect(httpMock).toHaveBeenCalledWith({ method: "post", url: URL_MAIN + "roles", headers: JSON_HEADERS, data: form });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "success" });
  });

  test("saveRole puts an existing role, and shows why the server refused it", async () => {
    respond({ "roles/5": refused("Ya existe un rol con ese nombre. Elige otro nombre.") });
    const store = useRolesStore();
    const form = { name: "Ventas", description: "", estado: true, permissions: [] };

    expect(await store.saveRole(5, form)).toBeNull();
    expect(httpMock).toHaveBeenCalledWith({ method: "put", url: URL_MAIN + "roles/5", headers: JSON_HEADERS, data: form });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({
      icon: "error",
      text: "Ya existe un rol con ese nombre. Elige otro nombre.",
    });
  });

  test("saveRoleUsers sends exactly the users who hold the role", async () => {
    respond({ "roles/5/users": accepted([]) });
    const store = useRolesStore();

    expect(await store.saveRoleUsers(5, [4, 8])).toBe(true);
    expect(httpMock).toHaveBeenCalledWith({
      method: "put",
      url: URL_MAIN + "roles/5/users",
      headers: JSON_HEADERS,
      data: { users: [4, 8] },
    });
  });

  test("setRoleStatus keeps the role's current permissions while switching it off", async () => {
    respond({ "permissions/catalog": accepted([catalogScreen(7, ["VER", "NUEVO"]), catalogScreen(8, [])]), "roles/5": accepted({ id: 5 }) });
    const store = useRolesStore();

    expect(await store.setRoleStatus(role, false)).toBe(true);
    const update = httpMock.mock.calls.find(([config]) => config.method === "put")![0];
    expect(update.data).toEqual({
      name: "Ventas",
      description: "Equipo comercial",
      estado: false,
      permissions: [{ menu_id: 7, actions: ["VER", "NUEVO"] }],
    });
  });

  test("setRoleStatus changes nothing when the current permissions can't be read", async () => {
    respond({ "permissions/catalog": new Error("Network Error") });
    const store = useRolesStore();

    expect(await store.setRoleStatus(role, false)).toBe(false);
    expect(httpMock.mock.calls.some(([config]) => config.method === "put")).toBe(false);
    expect(swalText()).toEqual([CONNECTION_ERROR_MESSAGE]);
  });
});

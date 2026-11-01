import { defineStore } from "pinia";
import { ref } from "vue";
import type { AxiosRequestConfig } from "axios";
import Swal from "sweetalert2";
import type { ApiResponse } from "@/types/api";
import type {
  CatalogScreen,
  PermissionListRow,
  RoleDetail,
  RoleFilters,
  RoleForm,
  RoleOption,
  RoleRow,
} from "@/types/roles";
import { grantsFromCatalog, permissionsPayload } from "@/utils/permissionGrants";
import { hasFailed, request } from "@/utils/request";

const URL_MAIN = import.meta.env.VITE_URL_MAIN;
const JSON_HEADERS = { "Content-Type": "application/json" };

async function call<Data>(config: AxiosRequestConfig): Promise<ApiResponse<Data>> {
  const response = (await request({ ...config, headers: JSON_HEADERS })) as unknown as ApiResponse<Data>;
  if (response.token) sessionStorage.setItem("auth-token", response.token);
  return response;
}

const showError = (text: string) => Swal.fire({ icon: "error", text });

async function load<Data>(config: AxiosRequestConfig): Promise<Data | null> {
  const response = await call<Data>(config);
  if (hasFailed(response)) showError(response.mensaje);
  return response.estadoflag ? response.data : null;
}

export const useRolesStore = defineStore("roles", () => {
  const roles = ref<RoleRow[]>([]);
  const options = ref<RoleOption[]>([]);
  const role = ref<RoleDetail | null>(null);
  const catalog = ref<CatalogScreen[]>([]);
  const permissionList = ref<PermissionListRow[]>([]);

  async function fetchRoles(filters: RoleFilters): Promise<void> {
    roles.value = (await load<RoleRow[]>({ method: "get", url: URL_MAIN + "roles", params: filters })) ?? [];
  }

  async function fetchRoleOptions(): Promise<void> {
    options.value = (await load<RoleOption[]>({ method: "get", url: URL_MAIN + "roles/options" })) ?? [];
  }

  async function fetchRole(id: number): Promise<void> {
    role.value = await load<RoleDetail>({ method: "get", url: URL_MAIN + `roles/${id}` });
  }

  async function fetchCatalog(roleId: number | null): Promise<void> {
    catalog.value =
      (await load<CatalogScreen[]>({
        method: "get",
        url: URL_MAIN + "permissions/catalog",
        params: { role_id: roleId ?? "" },
      })) ?? [];
  }

  async function fetchPermissionList(): Promise<void> {
    permissionList.value = (await load<PermissionListRow[]>({ method: "get", url: URL_MAIN + "permissions/list" })) ?? [];
  }

  async function save<Data>(config: AxiosRequestConfig): Promise<ApiResponse<Data>> {
    const response = await call<Data>(config);
    await Swal.fire({ icon: response.estadoflag ? "success" : "error", text: response.mensaje });
    return response;
  }

  async function saveRole(id: number | null, form: RoleForm): Promise<number | null> {
    const response = await save<{ id: number }>({
      method: id ? "put" : "post",
      url: URL_MAIN + (id ? `roles/${id}` : "roles"),
      data: form,
    });
    return response.estadoflag ? response.data.id : null;
  }

  async function saveRoleUsers(id: number, users: number[]): Promise<boolean> {
    return (await save({ method: "put", url: URL_MAIN + `roles/${id}/users`, data: { users } })).estadoflag;
  }

  async function setRoleStatus(row: RoleRow, estado: boolean): Promise<boolean> {
    const current = await call<CatalogScreen[]>({
      method: "get",
      url: URL_MAIN + "permissions/catalog",
      params: { role_id: row.id },
    });
    if (!current.estadoflag) {
      await showError(current.mensaje);
      return false;
    }
    const permissions = permissionsPayload(grantsFromCatalog(current.data));
    const form = { name: row.name, description: row.description ?? "", estado, permissions };
    return (await saveRole(row.id, form)) !== null;
  }

  return {
    roles,
    options,
    role,
    catalog,
    permissionList,
    fetchRoles,
    fetchRoleOptions,
    fetchRole,
    fetchCatalog,
    fetchPermissionList,
    saveRole,
    saveRoleUsers,
    setRoleStatus,
  };
});

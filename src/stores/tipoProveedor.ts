import { acceptHMRUpdate, defineStore } from "pinia";
import { ref } from "vue";
import type { FiltroTipoProveedor, TipoProveedor, TipoProveedorForm } from "@/types/tipoProveedor";
import { request } from "@/utils/request";
import { sessionBranchId } from "@/utils/sesion";

const JSON_HEADERS = { "Content-Type": "application/json" };
const url = (path: string) => import.meta.env.VITE_URL_MAIN + path;
// Category is not managed on this screen yet, so every request sends it empty.
const SIN_CATEGORIA = "";

export const useTipoProveedorStore = defineStore("tipoProveedor", () => {
  const tipos = ref<TipoProveedor[]>([]);

  async function loadTipos(filters: FiltroTipoProveedor) {
    const answer = await request<TipoProveedor>({
      method: "get",
      url: url("listar_table_role"),
      params: {
        id_branch: sessionBranchId(),
        code: (filters.code ?? "").trim(),
        name: (filters.name ?? "").trim(),
        categoria: SIN_CATEGORIA,
        status: filters.status ?? "",
      },
      headers: JSON_HEADERS,
    });
    tipos.value = answer.estadoflag ? answer.data : [];
    return answer;
  }

  const insertTipo = (tipo: TipoProveedorForm) =>
    request({
      method: "post",
      url: url("insertar_table_role"),
      headers: JSON_HEADERS,
      data: {
        name: tipo.name,
        description: tipo.description,
        categoria: SIN_CATEGORIA,
        id_proveedor: tipo.id_proveedor,
      },
    });

  const updateTipo = (tipo: TipoProveedorForm) =>
    request({
      method: "put",
      url: url("actualizar_table_role"),
      headers: JSON_HEADERS,
      data: {
        id: tipo.id,
        id_branch: sessionBranchId(),
        code: tipo.code,
        name: tipo.name,
        description: tipo.description,
        categoria: SIN_CATEGORIA,
        status: tipo.status,
      },
    });

  const saveTipo = (tipo: TipoProveedorForm) => (tipo.id ? updateTipo(tipo) : insertTipo(tipo));

  const deleteTipo = (tipo: TipoProveedor) =>
    request({ method: "put", url: url("eliminar_table_role"), headers: JSON_HEADERS, data: { id: tipo.id } });

  return { tipos, loadTipos, saveTipo, deleteTipo };
});

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useTipoProveedorStore, import.meta.hot));

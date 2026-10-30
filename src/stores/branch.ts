import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import type { SucursalListado } from "@/types/seguridad";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { request } from "@/utils/request";
import { useCityStore } from "@/stores/city";

export const useBranchStore = defineStore("branch", () => {
  const lstBranch = ref<SucursalListado[]>([]);

  async function ListadoSucursal(): Promise<void> {
    const data = await request<SucursalListado>({
      method: "get",
      url: `${import.meta.env.VITE_URL_MAIN}listar_sucursal`,
      headers: { "Content-Type": "application/json" },
    });
    if (data.estadoflag) {
      lstBranch.value = data.data;
    } else {
      useCityStore().lstCity = [];
      showRejectedResponse(data);
    }
  }

  async function changeStatus(path: "inactivar_sucursal" | "reactivar_sucursal", id: number): Promise<boolean> {
    const data = await request({
      method: "put",
      url: `${import.meta.env.VITE_URL_MAIN}${path}`,
      data: { id },
      headers: { "Content-Type": "application/json" },
    });
    await Swal.fire({ icon: data.estadoflag ? "success" : "error", text: data.mensaje });
    return data.estadoflag;
  }

  const inactivarSucursal = (id: number) => changeStatus("inactivar_sucursal", id);
  const reactivarSucursal = (id: number) => changeStatus("reactivar_sucursal", id);

  return { lstBranch, ListadoSucursal, inactivarSucursal, reactivarSucursal };
});

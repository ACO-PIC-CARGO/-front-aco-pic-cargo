import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import type { ConfigAviso } from "@/types/operaciones";
import { request } from "@/utils/request";

export const useConfigAvisoStore = defineStore("configAviso", () => {
  const configAviso = ref<ConfigAviso>({});
  const loading = ref(false);
  const saving = ref(false);
  const loadError = ref("");

  async function obtenerConfigAviso(): Promise<void> {
    loading.value = true;
    const response = await request<ConfigAviso>({ method: "get", url: import.meta.env.VITE_URL_MAIN + "get_ver_configaviso" });
    loading.value = false;
    if (response.estadoflag) configAviso.value = response.data[0]!;
    loadError.value = response.estadoflag ? "" : response.mensaje;
  }

  async function actualizarConfigAviso(data: ConfigAviso): Promise<void> {
    if (saving.value) return;
    saving.value = true;
    const response = await request({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizarConfigAviso",
      data: { aviso_llegada: data.aviso_llegada },
    });
    saving.value = false;
    Swal.fire({ icon: response.estadoflag ? "success" : "warning", text: response.mensaje });
    if (response.estadoflag) await obtenerConfigAviso();
  }

  return { configAviso, loading, saving, loadError, obtenerConfigAviso, actualizarConfigAviso };
});

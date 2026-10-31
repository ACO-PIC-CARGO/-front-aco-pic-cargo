import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { FiltroMotonave, Motonave } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { request } from "@/utils/request";

export const useMotonaveStore = defineStore("motonave", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const lstMotonave = ref<Motonave[]>([]);
  const MotonaveFilter = ref<FiltroMotonave>({
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    id_transporte: "",
    status: "1",
  });
  const MotonaveModel = ref<Partial<Motonave>>({
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    id_transporte: "",
    status: "1",
  });

  async function GetListMotonave(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "listar_motonave",
      params: {
        name: MotonaveFilter.value.name || null,
        description: MotonaveFilter.value.description || null,
        status: MotonaveFilter.value.status == "null" ? null : MotonaveFilter.value.status,
      },
      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<Motonave[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);
          if (data.estadoflag == true) {
            lstMotonave.value = data.data;
          } else {
            lstMotonave.value = [];
            showRejectedResponse(data);
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function saveMotonave(method: "post" | "put", path: string): Promise<boolean> {
    const response = await request({
      method,
      url: import.meta.env.VITE_URL_MAIN + path,
      headers: { "Content-Type": "application/json" },
      data: MotonaveModel.value,
    });
    Swal.fire({ icon: response.estadoflag ? "success" : "error", text: response.mensaje });
    return response.estadoflag;
  }

  const setMotonave = () => saveMotonave("post", "insertar_motonave");
  const ActualizarMotonave = () => saveMotonave("put", "actualizar_motonave");

  return { tipo, drawer, lstMotonave, MotonaveFilter, MotonaveModel, GetListMotonave, setMotonave, ActualizarMotonave };
});

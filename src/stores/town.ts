import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { Distrito, FiltroDistrito } from "@/types/catalogos";
import { filledParams } from "@/utils/queryParams";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { request } from "@/utils/request";
import { shareWhilePending } from "@/utils/sharedRequest";

type DistritoRow = Distrito & { editableflag?: boolean };

export const useTownStore = defineStore("town", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const lstTown = ref<Distrito[]>([]);
  const lstTownPricing = ref<Distrito[]>([]);
  const editable = ref(false);
  const filtros = ref<FiltroDistrito>({
    id: "",
    id_pais: "",
    id_city: "",
    id_state: "",
    id_town: "",
    code: "",
    name: "",
    description: "",
    status: "1",
  });
  const model = ref<Partial<Distrito>>({
    id: "",
    id_pais: "",
    id_city: "",
    id_state: "",
    id_town: "",
    code: "",
    name: "",
    description: "",
    status: "1",
  });

  async function GetListTown(): Promise<void> {
    const { id_pais, id_state, id_city, code, name, description, status } = filtros.value;
    const response = await request<DistritoRow>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "listar_town",
      headers: { "Content-Type": "application/json" },
      params: filledParams({ id_pais, id_state, id_city, code, name, description, status }),
    });
    lstTown.value = response.estadoflag ? response.data : [];
    if (response.estadoflag) editable.value = Boolean(response.data[0]!.editableflag);
    else showRejectedResponse(response);
  }

  const requestTownsForPricing = shareWhilePending((params: { id_pais: number | string }) =>
    axios<ApiResponse<Distrito[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_town_pricing`,
      params: params,
      headers: { "Content-Type": "application/json" },
    }),
  );

  async function cargarTownParaPricing(params: { id_pais: number | string }): Promise<void> {
    try {
      await requestTownsForPricing(params)
        .then(function (response) {
          const data = response.data;
          if (data.estadoflag == true) {
            lstTownPricing.value = data.data;
          } else {
            lstTownPricing.value = [];
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function saveTown(method: "post" | "put", endpoint: string): Promise<boolean> {
    const response = await request({
      method,
      url: import.meta.env.VITE_URL_MAIN + endpoint,
      headers: { "Content-Type": "application/json" },
      data: model.value,
    });
    await Swal.fire({
      icon: response.estadoflag ? "success" : "error",
      text: response.mensaje,
    });
    return response.estadoflag;
  }

  const setTown = () => saveTown("post", "insertar_town");
  const ActualizarTown = () => saveTown("put", "actualizar_town");

  return {
    tipo,
    drawer,
    lstTown,
    lstTownPricing,
    editable,
    filtros,
    model,
    GetListTown,
    cargarTownParaPricing,
    setTown,
    ActualizarTown,
  };
});

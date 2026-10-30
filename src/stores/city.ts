import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import type { Ciudad, FiltroCiudad } from "@/types/catalogos";
import { filledParams } from "@/utils/queryParams";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { request } from "@/utils/request";

type CiudadRow = Ciudad & { editableflag?: boolean };

export const useCityStore = defineStore("city", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const lstCity = ref<Ciudad[]>([]);
  const editable = ref(false);
  const filtros = ref<FiltroCiudad>({
    id: "",
    id_pais: "",
    id_state: "",
    code: "",
    name: "",
    description: "",
    status: "1",
  });
  const model = ref<Partial<Ciudad>>({
    id: "",
    id_pais: "",
    id_state: "",
    code: "",
    name: "",
    description: "",
    status: "1",
  });

  async function GetListCity(): Promise<void> {
    const { id_pais, id_state, code, name, description, status } = filtros.value;
    const response = await request<CiudadRow>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "listar_city",
      headers: { "Content-Type": "application/json" },
      params: filledParams({ id_pais, id_state, code, name, description, status }),
    });
    lstCity.value = response.estadoflag ? response.data : [];
    if (response.estadoflag) editable.value = Boolean(response.data[0]!.editableflag);
    else showRejectedResponse(response);
  }

  async function saveCity(method: "post" | "put", endpoint: string): Promise<boolean> {
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

  const setCity = () => saveCity("post", "insertar_city");
  const ActualizarCity = () => saveCity("put", "actualizar_city");

  return { tipo, drawer, lstCity, editable, filtros, model, GetListCity, setCity, ActualizarCity };
});

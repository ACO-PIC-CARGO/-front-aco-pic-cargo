import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import type { EstadoRegion, FiltroEstadoRegion } from "@/types/catalogos";
import { filledParams } from "@/utils/queryParams";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { request } from "@/utils/request";

type EstadoRegionRow = EstadoRegion & { editableflag?: boolean };

export const useStatesStore = defineStore("states", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const lstState = ref<EstadoRegion[]>([]);
  const editable = ref(false);
  const StateFilter = ref<FiltroEstadoRegion>({
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    status: "1",
  });
  const StateModel = ref<Partial<EstadoRegion>>({
    id: "",
    id_pais: "",
    code: "",
    name: "",
    description: "",
    status: "1",
  });

  async function GetListState(): Promise<void> {
    const { id_pais, code, name, description, status } = StateFilter.value;
    const response = await request<EstadoRegionRow>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "listar_state",
      headers: { "Content-Type": "application/json" },
      params: filledParams({ id_pais, code, name, description, status }),
    });
    lstState.value = response.estadoflag ? response.data : [];
    if (response.estadoflag) editable.value = Boolean(response.data[0]!.editableflag);
    else showRejectedResponse(response);
  }

  async function saveState(method: "post" | "put", endpoint: string): Promise<boolean> {
    const response = await request({
      method,
      url: import.meta.env.VITE_URL_MAIN + endpoint,
      headers: { "Content-Type": "application/json" },
      data: StateModel.value,
    });
    await Swal.fire({
      icon: response.estadoflag ? "success" : "error",
      text: response.mensaje,
    });
    return response.estadoflag;
  }

  const setState = () => saveState("post", "insertar_state");
  const ActualizarState = () => saveState("put", "actualizar_state");

  return { tipo, drawer, lstState, editable, StateFilter, StateModel, GetListState, setState, ActualizarState };
});

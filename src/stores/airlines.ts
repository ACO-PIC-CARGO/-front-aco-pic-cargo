import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { Aerolinea, FiltroAerolinea } from "@/types/catalogos";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId, sessionBranchIdOrEmpty } from "@/utils/sesion";

export const useAirlinesStore = defineStore("airlines", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const lstAirline = ref<Aerolinea[]>([]);
  const AirlineFilter = ref<FiltroAerolinea>({
    code_iata: "",
    name: "",
    code_icao: "",
    code_three: "",
    id_pais: "",
    created_at: "",
    updated_at: "",
    code: "",
    status: true,
    id_branch: sessionBranchIdOrEmpty(),
  });
  const AirlineModel = ref<Partial<Aerolinea>>({
    code_iata: "",
    name: "",
    code_icao: "",
    code_three: "",
    id_pais: "",
    created_at: "",
    updated_at: "",
    code: "",
    status: "",
    id_branch: sessionBranchIdOrEmpty(),
  });

  async function GetListAirline(): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_airlines?id_branch=${sessionBranchId()}&code=${AirlineFilter.value.code ? AirlineFilter.value.code : ""}&code_iata=${
          AirlineFilter.value.code_iata ? AirlineFilter.value.code_iata : ""
        }&code_icao=${AirlineFilter.value.code_icao ? AirlineFilter.value.code_icao : ""}&name=${
          AirlineFilter.value.name ? AirlineFilter.value.name : ""
        }&status=${AirlineFilter.value.status ? AirlineFilter.value.status : ""}&id_pais=${
          AirlineFilter.value.id_pais ? AirlineFilter.value.id_pais : ""
        }
        `,
      headers: { "Content-Type": "application/json" },
    };
    await axios<ApiResponse<Aerolinea[]>>(config)
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag == true) {
          lstAirline.value = data.data;
        } else {
          lstAirline.value = [];
          showRejectedResponse(data);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function ValidateCodigoIATANuevo(): Promise<ApiResponse> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `validate_iata_airlines_nuevo?id_branch=${sessionBranchId()}&code_iata=${AirlineModel.value.code_iata}
        `,
      headers: { "Content-Type": "application/json" },
    };
    const res = await axios<ApiResponse>(config);
    return res.data;
  }

  async function ValidateCodigoICAONuevo(): Promise<ApiResponse> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN + `validate_icao_airlines_nuevo?id_branch=${sessionBranchId()}&code_icao=${AirlineModel.value.code_icao}`,
      headers: { "Content-Type": "application/json" },
    };
    const res = await axios<ApiResponse>(config);
    return res.data;
  }

  async function setAirline(): Promise<void> {
    AirlineModel.value.id_branch = sessionBranchId();
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insert_airlines`,
      data: AirlineModel.value,
      headers: { "Content-Type": "application/json" },
    };
    await axios<ApiResponse>(config)
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function ValidateCodigoIATAEditar(): Promise<ApiResponse> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `validate_iata_airlines_editar?id=${AirlineModel.value.id}&id_branch=${AirlineModel.value.id_branch}&code_iata=${AirlineModel.value.code_iata}
        `,
      headers: { "Content-Type": "application/json" },
    };
    const res = await axios<ApiResponse>(config);
    return res.data;
  }

  async function ValidateCodigoICAOEditar(): Promise<ApiResponse> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `validate_icao_airlines_editar?id=${AirlineModel.value.id}&id_branch=${AirlineModel.value.id_branch}&code_icao=${AirlineModel.value.code_icao}`,
      headers: { "Content-Type": "application/json" },
    };
    const res = await axios<ApiResponse>(config);
    return res.data;
  }

  async function actualizarAirline(): Promise<void> {
    AirlineModel.value.id_branch = sessionBranchId();
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_airlines`,
      data: AirlineModel.value,
      headers: { "Content-Type": "application/json" },
    };
    await axios<ApiResponse>(config)
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          text: data.mensaje,
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  return {
    tipo,
    drawer,
    lstAirline,
    AirlineFilter,
    AirlineModel,
    GetListAirline,
    ValidateCodigoIATANuevo,
    ValidateCodigoICAONuevo,
    setAirline,
    ValidateCodigoIATAEditar,
    ValidateCodigoICAOEditar,
    actualizarAirline,
  };
});

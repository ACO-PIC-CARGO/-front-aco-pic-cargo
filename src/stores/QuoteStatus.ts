import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { FiltroEstadoCotizacion, PosicionMaximaEstado } from "@/types/catalogos";
import type { EstadoCotizacion } from "@/types/cotizacion";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId, sessionBranchIdOrEmpty } from "@/utils/sesion";

export const useQuoteStatusStore = defineStore("QuoteStatus", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const statusQuoteList = ref<EstadoCotizacion[]>([]);
  const max_position = ref(0);
  const max_position_calls = ref(0);
  const max_position_report = ref(0);
  const max_position_select = ref(0);
  const StatusFilter = ref<FiltroEstadoCotizacion>({
    id: "",
    name: "",
    code: "",
    position: "",
    position_select: "",
    position_report: "",
    position_calls: "",
    status_calls: "",
    status_calls_all: "",
    description: "",
    status: "1",
    id_branch: sessionBranchIdOrEmpty(),
  });
  const StatusModel = ref<EstadoCotizacion>({
    id: "",
    name: "",
    code: "",
    position: "",
    position_select: "",
    position_report: "",
    position_calls: "",
    status_calls: "",
    status_calls_all: "",
    description: "",
    status: "1",
    id_branch: sessionBranchIdOrEmpty(),
  });

  function setMaxPositionQuoteList(data: PosicionMaximaEstado[] | null): void {
    max_position.value = data ? data[0]!.position : 1;
    max_position_calls.value = data ? data[0]!.position_calls : 1;
    max_position_report.value = data ? data[0]!.position_report : 1;
    max_position_select.value = data ? data[0]!.position_select : 1;
  }

  async function GetListQuoteStatus(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `list_quote_status`,
      params: {
        ...StatusFilter.value,
        id_branch: sessionBranchId(),
      },
      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<EstadoCotizacion[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);
          if (data.estadoflag == true) {
            statusQuoteList.value = data.data;
            MaxPositionQuoteStatus();
          } else {
            statusQuoteList.value = [];
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

  async function MaxPositionQuoteStatus(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `max_position_quote_status?id_branch=${sessionBranchId()}`,
      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<PosicionMaximaEstado[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);
          if (data.estadoflag == true) {
            setMaxPositionQuoteList(data.data);
          } else {
            setMaxPositionQuoteList([]);
            Swal.fire({
              icon: "warning",
              title: "Aviso",
              text: data.mensaje,
            });
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function getValidatePositionQuoteStatus(): Promise<ApiResponse | undefined> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `validate_position_status_quote?id_branch=${sessionBranchId()}&position=${StatusModel.value.position}`,
      headers: { "Content-Type": "application/json" },
    };
    try {
      const res = await axios<ApiResponse>(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  }

  async function getValidatePositionSelectQuoteStatus(): Promise<ApiResponse | undefined> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `validate_position_select_status_quote?id_branch=${sessionBranchId()}&position_select=${StatusModel.value.position_select}`,
      headers: { "Content-Type": "application/json" },
    };
    try {
      const res = await axios<ApiResponse>(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  }

  async function getValidatePositionReportQuoteStatus(): Promise<ApiResponse | undefined> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `validate_position_report_status_quote?id_branch=${sessionBranchId()}&position_report=${StatusModel.value.position_report}`,
      headers: { "Content-Type": "application/json" },
    };
    try {
      const res = await axios<ApiResponse>(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  }

  async function getValidatePositionCallsQuoteStatus(): Promise<ApiResponse | undefined> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `validate_position_calls_status_quote?id_branch=${sessionBranchId()}&position_calls=${StatusModel.value.position_calls}`,
      headers: { "Content-Type": "application/json" },
    };
    try {
      const res = await axios<ApiResponse>(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  }

  async function setQuoteStatus(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insertar_position_calls`,
      headers: { "Content-Type": "application/json" },
      data: StatusModel.value,
    };
    try {
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
    } catch (error) {
      console.error(error);
    }
  }

  async function getValidatePositionActualizarQuoteStatus(): Promise<ApiResponse | undefined> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `validate_position_actualizar_status_quote?id_branch=${sessionBranchId()}&id=${StatusModel.value.id}&position=${StatusModel.value.position}`,
      headers: { "Content-Type": "application/json" },
    };
    try {
      const res = await axios<ApiResponse>(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  }

  async function getValidatePositionSelectActualizarQuoteStatus(): Promise<ApiResponse | undefined> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `validate_position_select_actualizar_status_quote?id_branch=${sessionBranchId()}&id=${StatusModel.value.id}&position_select=${
          StatusModel.value.position_select
        }`,
      headers: { "Content-Type": "application/json" },
    };
    try {
      const res = await axios<ApiResponse>(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  }

  async function getValidatePositionReportActualizarQuoteStatus(): Promise<ApiResponse | undefined> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `validate_position_report_actualizar_status_quote?id_branch=${sessionBranchId()}&id=${StatusModel.value.id}&position_report=${
          StatusModel.value.position_report
        }`,
      headers: { "Content-Type": "application/json" },
    };
    try {
      const res = await axios<ApiResponse>(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  }

  async function getValidatePositionCallsActualizarQuoteStatus(): Promise<ApiResponse | undefined> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `validate_position_calls_actualizar_status_quote?id_branch=${sessionBranchId()}&id=${StatusModel.value.id}&position_calls=${
          StatusModel.value.position_calls
        }`,
      headers: { "Content-Type": "application/json" },
    };
    try {
      const res = await axios<ApiResponse>(config);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  }

  async function actualizarQuoteStatus(): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_position_calls`,
      headers: { "Content-Type": "application/json" },
      data: StatusModel.value,
    };
    try {
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
    } catch (error) {
      console.error(error);
    }
  }

  return {
    tipo,
    drawer,
    statusQuoteList,
    max_position,
    max_position_calls,
    max_position_report,
    max_position_select,
    StatusFilter,
    StatusModel,
    GetListQuoteStatus,
    MaxPositionQuoteStatus,
    getValidatePositionQuoteStatus,
    getValidatePositionSelectQuoteStatus,
    getValidatePositionReportQuoteStatus,
    getValidatePositionCallsQuoteStatus,
    setQuoteStatus,
    getValidatePositionActualizarQuoteStatus,
    getValidatePositionSelectActualizarQuoteStatus,
    getValidatePositionReportActualizarQuoteStatus,
    getValidatePositionCallsActualizarQuoteStatus,
    actualizarQuoteStatus,
  };
});

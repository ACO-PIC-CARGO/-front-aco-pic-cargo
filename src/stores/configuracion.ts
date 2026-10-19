import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type {
  CostoPricing,
  FiltroCostosPricing,
  FiltroIncotermsCostos,
  GuardarCostosPricing,
  GuardarTextoWhatsappFcl,
  GuardarTextoWhatsappLcl,
  IncotermConfigCostos,
  ServicioPricingConfig,
  TextoWhatsapp,
  TextoWhatsappConfig,
  TextoWhatsappFcl,
} from "@/types/configuracion";
import type { Multiplicador } from "@/types/cotizacion";
import { sessionBranchId } from "@/utils/sesion";

export const useConfiguracionStore = defineStore("configuracion", () => {
  const lstCostos = ref<CostoPricing[]>([]);
  const lstMultiplicador = ref<Multiplicador[]>([]);
  const lstServicios = ref<ServicioPricingConfig[]>([]);
  const lstIncoterms = ref<IncotermConfigCostos[]>([]);
  const lcl = ref<TextoWhatsapp>({});
  const fcl = ref<TextoWhatsappFcl[]>({} as TextoWhatsappFcl[]);
  const id = ref<number | null | undefined>(null);

  function setTextWhatsapp(data: Partial<TextoWhatsappConfig>): void {
    id.value = data.id;
    lcl.value = data.lcl || {};
    fcl.value = data.fcl || ({} as TextoWhatsappFcl[]);
  }

  async function getCargarCostos(data: FiltroCostosPricing): Promise<void> {
    await axios<ApiResponse<CostoPricing[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "costo_pricing",
      params: data,
      headers: { "Content-Type": "application/json" },
    })
      .then(function (response) {
        lstCostos.value = response.data.data;
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function obtenerServicioPricingConfig(data: FiltroCostosPricing): Promise<void> {
    data.id_branch = sessionBranchId();
    await axios<ApiResponse<ServicioPricingConfig[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "obtener_servicio_pricing_config",
      params: data,
      headers: { "Content-Type": "application/json" },
    })
      .then(function (response) {
        lstServicios.value = response.data.data;
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function getMultiplicadorConfigCosto(id_shipment: number | string): Promise<void> {
    const data = {
      id_shipment: id_shipment,
      containers: [],
      id_branch: sessionBranchId(),
    };
    //
    await axios<ApiResponse<Multiplicador[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "cargar_multiplicador_config_costo",
      params: data,
      headers: { "Content-Type": "application/json" },
    })
      .then(function (response) {
        const res = response.data;
        if (res.estadoflag) {
          lstMultiplicador.value = res.data;
        } else {
          lstMultiplicador.value = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function setGuardarCostos(data: GuardarCostosPricing): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "costo_pricing_actualizar",
      data: data,
      headers: { "Content-Type": "application/json" },
    })
      .then(function (response) {
        const res = response.data;
        Swal.fire({
          icon: res.estadoflag ? "success" : "error",
          text: res.mensaje,
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function getTextWhatsapp(): Promise<void> {
    await axios<ApiResponse<TextoWhatsappConfig[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "text_whatsapp",
      params: {
        id_branch: sessionBranchId(),
      },
      headers: { "Content-Type": "application/json" },
    })
      .then(function (response) {
        if (response.data.estadoflag) {
          setTextWhatsapp(response.data.data[0]!);
        } else {
          setTextWhatsapp({});
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function setTextoWhatsappLCL(data: GuardarTextoWhatsappLcl): Promise<void> {
    data.id = id.value;
    data.id_branch = sessionBranchId();
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "text_whatsapp_lcl",
      data: data,
      headers: { "Content-Type": "application/json" },
    })
      .then(function (response) {
        const res = response.data;
        Swal.fire({
          icon: res.estadoflag ? "success" : "error",
          text: res.mensaje,
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function setTextoWhatsappFCL(data: GuardarTextoWhatsappFcl): Promise<void> {
    data.id = id.value;
    data.id_branch = sessionBranchId();
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "text_whatsapp_fcl",
      data: data,
      headers: { "Content-Type": "application/json" },
    })
      .then(function (response) {
        const res = response.data;
        Swal.fire({
          icon: res.estadoflag ? "success" : "error",
          text: res.mensaje,
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function EliminarCosto(data: CostoPricing): Promise<void> {
    await axios<ApiResponse>({
      method: "delete",
      url: import.meta.env.VITE_URL_MAIN + "costo_eliminar",
      data: data,
      headers: { "Content-Type": "application/json" },
    })
      .then(function (response) {
        const res = response.data;
        Swal.fire({
          icon: res.estadoflag ? "success" : "error",
          text: res.mensaje,
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function ObtenerIncotermsConfigCostos(data: FiltroIncotermsCostos): Promise<void> {
    data.id_branch = sessionBranchId();
    await axios<ApiResponse<IncotermConfigCostos[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "incoterms_config_costos",
      params: data,
      headers: { "Content-Type": "application/json" },
    })
      .then(function (response) {
        const res = response.data;
        if (res.estadoflag) {
          lstIncoterms.value = response.data.data;
        } else {
          lstIncoterms.value = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  return {
    lstCostos,
    lstMultiplicador,
    lstServicios,
    lstIncoterms,
    lcl,
    fcl,
    id,
    getCargarCostos,
    obtenerServicioPricingConfig,
    getMultiplicadorConfigCosto,
    setGuardarCostos,
    getTextWhatsapp,
    setTextoWhatsappLCL,
    setTextoWhatsappFCL,
    EliminarCosto,
    ObtenerIncotermsConfigCostos,
  };
});

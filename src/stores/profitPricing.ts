import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { ConceptoProfitPricing, ListadoProfitPricing, ProfitPricingCosto } from "@/types/cotizacion";

export const useProfitPricingStore = defineStore("profitPricing", () => {
  const lstProfigIndividual = ref<ProfitPricingCosto[] | undefined>([]);
  const lstProfigGrupal = ref<ProfitPricingCosto[] | undefined>([]);
  const id_shipment = ref<number | string>("");
  const id_incoterms = ref<number | string>("");
  const id_modality = ref<number | string>("");
  const lstCostosAsignarProfit = ref<ConceptoProfitPricing[]>([]);

  async function getProfitPricing(): Promise<void> {
    await axios<ApiResponse<ListadoProfitPricing[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "profit_pricing_listado",
      params: {
        id_shipment: id_shipment.value,
        id_incoterms: id_incoterms.value,
        id_modality: id_modality.value,
      },
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(function (response) {
        const res = response.data;
        if (res.estadoflag) {
          const listado = res.data[0]!;
          lstProfigIndividual.value = listado.profitindividual;
          lstProfigGrupal.value = listado.profitgrupal;
        } else {
          // A rejected response leaves both lists undefined.
          lstProfigIndividual.value = undefined;
          lstProfigGrupal.value = undefined;
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function getProfitPricingCostos(): Promise<void> {
    await axios<ApiResponse<ConceptoProfitPricing[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "profit_pricing_listado_costos",
      params: {
        id_shipment: id_shipment.value,
        id_incoterms: id_incoterms.value,
        id_modality: id_modality.value,
      },
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(function (response) {
        const res = response.data;
        if (res.estadoflag) {
          lstCostosAsignarProfit.value = res.data;
        } else {
          lstCostosAsignarProfit.value = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function setProfitPricingCostos(): Promise<void> {
    await axios<ApiResponse>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "profit_pricing_costos_set",
      data: {
        lstProfigIndividual: lstProfigIndividual.value,
        lstProfigGrupal: lstProfigGrupal.value,
        id_shipment: id_shipment.value,
        id_incoterms: id_incoterms.value,
        id_modality: id_modality.value,
      },
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(function (response) {
        const res = response.data;
        if (res.estadoflag) {
          Swal.fire({
            icon: "success",
            text: res.mensaje,
          });
        } else {
          console.log(res.mensaje);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  return {
    lstProfigIndividual,
    lstProfigGrupal,
    id_shipment,
    id_incoterms,
    id_modality,
    lstCostosAsignarProfit,
    getProfitPricing,
    getProfitPricingCostos,
    setProfitPricingCostos,
  };
});

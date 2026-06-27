import axios from "@/api/axios-config";
import Swal from "sweetalert2";

const state = {
  lstProfigIndividual: [],
  lstProfigGrupal: [],
  id_shipment: "",
  id_incoterms: "",
  id_modality: "",
  lstCostosAsignarProfit: [],
};
const mutations = {
  SET_LISTADO_PROFIT(state, data) {
    state.lstProfigIndividual = data.profitindividual;
    state.lstProfigGrupal = data.profitgrupal;
  },
  SET_LISTADO_COSTOS_PROFIT(state, data) {
    state.lstCostosAsignarProfit = data;
  },
};
const actions = {
  async getProfitPricing({ commit }) {
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "profit_pricing_listado",
      params: {
        id_shipment: state.id_shipment,
        id_incoterms: state.id_incoterms,
        id_modality: state.id_modality,
      },
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let res = response.data;
        if (res.estadoflag) {
          commit("SET_LISTADO_PROFIT", res.data[0]);
        } else {
          commit("SET_LISTADO_PROFIT", []);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async getProfitPricingCostos({ commit }) {
    var config = {
      method: "get",
      url: process.env.VUE_APP_URL_MAIN + "profit_pricing_listado_costos",
      params: {
        id_shipment: state.id_shipment,
        id_incoterms: state.id_incoterms,
        id_modality: state.id_modality,
      },
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let res = response.data;
        if (res.estadoflag) {
          commit("SET_LISTADO_COSTOS_PROFIT", res.data);
        } else {
          commit("SET_LISTADO_COSTOS_PROFIT", []);
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  async setProfitPricingCostos({ commit }) {
    var config = {
      method: "post",
      url: process.env.VUE_APP_URL_MAIN + "profit_pricing_costos_set",
      data: {
        lstProfigIndividual: state.lstProfigIndividual,
        lstProfigGrupal: state.lstProfigGrupal,
        id_shipment: state.id_shipment,
        id_incoterms: state.id_incoterms,
        id_modality: state.id_modality,
      },
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios(config)
      .then(function (response) {
        let res = response.data;
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
        console.log(error);
      });
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};

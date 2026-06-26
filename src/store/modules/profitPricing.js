import axios from '@/api/axios-config';

const state = {
  lstProfigIndividual: [],
  lstProfigGrupal: [],
  id_shipment: "",
  id_incoterms: "",
  id_modality: "",
};
const mutations = {
  SET_LISTADO_PROFIT(state, data) {
    state.lstProfigIndividual = data.profitindividual;
    state.lstProfigGrupal = data.profitgrupal;
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
        console.log(response)
        // commit("SET_VALIDACION_BANCO", response.data);
        // res = response.data;
      })
      .catch(function (error) {
        console.log(error);
      });
    // return res;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};

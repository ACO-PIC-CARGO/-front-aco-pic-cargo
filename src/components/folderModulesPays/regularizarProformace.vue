<template>
  <div>
    <v-dialog max-width="800" v-model="dialogReplace">
      <v-card elevation="0">
        <v-card-title> Regularizar Proformace </v-card-title>
        <v-card-text>
          <controlAccountPaysCom
            operativa="1"
            :exp="exp"
            :pro="pro"
            :id_pro="id_pro"
            tipo="nuevo"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-data-table :headers="headersPro" :items="itemsPro">
      <template v-slot:[`item.action`]="{ item }">
        <v-icon
          class="btn_add mr-2"
          size="large"
          color="blue"
          @click="_setReplace(item.id, item.id_house, item.id_pro)"
          >mdi-file-replace</v-icon
        >
      </template>

      <template v-slot:[`item.vpro`]="{ item }">
        <v-icon
          class="btn_add mr-2"
          size="large"
          color="grey"
          @click="_seePro(item.path)"
          >mdi-eye</v-icon
        >
      </template>
    </v-data-table>
  </div>
</template>
<script>
import axios from '@/api/axios-config';
import controlAccountPaysCom from "@/components/folderModulesPays/controlAccountPays";
export default {
  name: "RegularizarFacturaCom",
  components: {
    controlAccountPaysCom,
  },
  data: () => ({
    itemsPro: [],
    dialogReplace: false,
    searchFactura: "",
    headersPro: [
      {
        title: "Expediente",
        key: "nro_master",
      },
      {
        title: "Proveedor",
        key: "nameconsigner",
      },
      {
        title: "Fecha",
        key: "date_letra",
      },
      /* {
        text: "Nro. Serie",
        value: "number",
      }, */
      {
        title: "Moneda",
        key: "namecoins",
      },

      {
        title: "Monto",
        key: "total",
      },
      {
        title: "Fecha de Pago",
        key: "fecha_pago",
      },
      {
        title: "Soporte de Pago",
        key: "soporte_pago",
      },
      {
        title: "Ver Proformace",
        key: "vpro",
      },
      {
        title: "Acción",
        key: "action",
      },
    ],

    exp: "",
    pro: "",
    id_pro: "",
  }),
  mounted() {
    this._getRegularizar();
  },
  methods: {
    _seePro(path) {
      window.open(path, "_blank");
    },
    _setReplace(pro, exp, prov) {
      this.pro = pro;
      this.exp = exp;
      this.id_pro = prov;
      this.dialogReplace = true;
    },
    async _getRegularizar() {
      var vm = this;

      var config = {
        method: "post",
        url: import.meta.env.VUE_APP_URL_MAIN + "getRegularizar",

        headers: {
         
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          //vm.dialogListInvoince = true;
          
          vm.itemsPro = response.data.data;
        })
        .catch(function (error) {
          console.error(error);
        });
    },
  },
};
</script>
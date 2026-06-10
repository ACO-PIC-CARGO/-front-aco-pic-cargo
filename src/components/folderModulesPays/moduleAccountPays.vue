<template>
  <div>
    <v-card elevation="0">
      <v-card-title class="py-0">
        <v-spacer></v-spacer>
        <v-btn elevation="0" @click="toPageAdd()" color="success">
          CARGAR FACTURA NUEVA
        </v-btn>
      </v-card-title>
      <v-card-text class="pa-1">
        <v-data-table
          :headers="headersFacturas"
          :items="itemsListInvoice"
          :search="searchFactura"
          :custom-filter="filterOnlyCapsText"
          ><template v-slot:top>
            <v-text-field
              v-model="searchFactura"
              label="Buscar...."
              class="mx-4"
            ></v-text-field>
          </template>
          <template v-slot:[`item.accion`]="{ item }">
            <v-chip
              block
              medium
              class=""
              color="orange"
              text-color="white"
              v-if="item.status == 1"
            >
              Pendiente
            </v-chip>
            <v-chip
              block
              medium
              class=""
              color="success"
              v-if="item.status == 2"
            >
              Pagado
            </v-chip>
          </template>
          <template v-slot:[`item.action`]="{ item }">
            <v-icon
              class="btn_add mr-2"
              dense
              small
              icon
              v-if="item.status == 1"
              color="red"
              @click="delPro(item.id)"
            >
              mdi-delete
            </v-icon>
            <v-icon
              class="btn_add mr-2"
              dense
              small
              icon
              v-if="item.status == 1"
              color="blue"
              @click="penPro(item.id)"
            >
              mdi-pencil
            </v-icon>

            <v-icon
              class="btn_add mr-2"
              dense
              small
              icon
              color="green"
              @click="eyePro(item.id)"
            >
              mdi-eye
            </v-icon>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog max-width="600" v-model="dialogPayment">
      <v-card>
        <v-card-title> SUBIR PAGO </v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="4">
              <v-menu
                ref="menu"
                v-model="menu"
                :close-on-content-click="false"
                :return-value.sync="date"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="date"
                    label="Fecha de Operación"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                  ></v-text-field>
                </template>
                <v-date-picker
                  locale="es-pe"
                  v-model="date"
                  no-title
                  scrollable
                >
                  <v-spacer></v-spacer>
                  <v-btn text color="primary" @click="menu = false">
                    Cancel
                  </v-btn>
                  <v-btn text color="primary" @click="$refs.menu.save(date)">
                    OK
                  </v-btn>
                </v-date-picker>
              </v-menu>
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="serie_pago"
                label="No. Serie"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="5">
              <v-text-field
                v-model="factura_pago"
                label="No. Factura"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="4">
              <v-autocomplete
                :items="$store.state.itemsDataBanksList"
                v-model="banco_pago"
                item-text="acronym"
                item-value="id"
                label="Banco"
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="4">
              <v-autocomplete
                :items="$store.state.itemsCoinsList"
                v-model="moneda_pago"
                item-text="acronym"
                item-value="id"
                label="Moneda"
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="monto_pago"
                type="number"
                label="Monto"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="9">
              <v-file-input
                v-if="!boolFile"
                v-model="payfile"
                show-size
                label="Adjuntar Pago"
              >
              </v-file-input>

              <v-chip
                block
                v-if="boolFile"
                large
                class=""
                color="success"
                outlined
              >
                <v-icon left> mdi-check </v-icon>
                Archivo cargado éxitosamente
              </v-chip>
            </v-col>
            <v-col cols="3">
              <v-btn
                :disabled="boolFile || payfile == []"
                color="blue-grey"
                block
                class="ma-2 white--text"
                large
                @click="_uploadFile()"
              >
                Subir
                <v-icon right dark> mdi-cloud-upload </v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            @click="_putInvoice(id_pro)"
            :disabled="!boolFile"
            >Procesar Pago</v-btn
          >
          <v-spacer></v-spacer>
          <v-btn outlined color="red" @click="dialogProcess = !dialogProcess"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import axios from '@/api/axios-config';
export default {
  name: "AccountPaysCom",
  data: () => ({
    itemsListInvoice: [],
    searchFactura: "",
    dialogPayment: false,
    date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .substr(0, 10),
    menu: false,
    modal: false,
    menu2: false,
    pathfileAll: "",
    boolFile: false,
    pathfile: "",
    payfile: "",
    payPath: "",
    serie_pago: "",
    factura_pago: "",
    moneda_pago: "",
    monto_pago: "",
    banco_pago: "",
    id_pro: "",
    headersFacturas: [
      {
        text: "Tipo",
        value: "paymentname",
      },
      {
        text: "Gasto",
        value: "gasto_description",
      },
      {
        text: "Sub Gasto",
        value: "subgasto_description",
      },

      {
        text: "Fecha Pago",
        value: "fecha",
      },
      {
        text: "Fecha Vencimiento",
        value: "fechavencimiento",
      },
      {
        text: "Expediente",
        value: "nro_master",
      },
      {
        text: "Proveedor",
        value: "nameconsigner",
      },
      {
        text: "Nro. Factura",
        value: "nro_factura",
      },
      {
        text: "Nro. Serie",
        value: "nro_serie",
      },
      {
        text: "Moneda",
        value: "namecoins",
      },

      {
        text: "Tipo de Cambio",
        value: "tipocambio",
      },
      {
        text: "Monto",
        value: "total",
        class: "totalcss",
      },
      {
        text: "Monto Dolar",
        value: "montodolar",
        class: "montodolarcss",
      },
      {
        text: "Cargar factura de pago",
        value: "accion",
      },
      {
        text: "Acción",
        value: "action",
      },
    ],
  }),

  async mounted() {
    this.$store.state.spiner = true;
    await this._getInvoiceAdmin();
    this.$store.state.spiner = false;
  },

  methods: {
    filterOnlyCapsText(value, search) {
      let text = search ? search.toLocaleUpperCase() : null;
      return (
        value != null &&
        search != null &&
        typeof value === "string" &&
        value.toString().toLocaleUpperCase().indexOf(text) !== -1
      );
    },
    toPageAdd() {
      this.$router.push({ name: "addAccountPays" });
    },

    uploadPayment(id) {
      this.id_pro = id;
      this.dialogPayment = true;
    },

    eyePro(id) {
      // window.open(id, "_blank");
      this.$router.push({ name: "viewAccountPays", params: { id: id } });
    },
    penPro(id) {
      // window.open(id, "_blank");
      this.$router.push({ name: "EditAccountPays", params: { id: id } });
    },

    _uploadFile() {
      var FormData = require("form-data");
      var fs = require("fs");
      var data = new FormData();
      var vm = this;
      data.append("name", "Prueba");
      data.append("file", vm.payfile);

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "uploadAllPath",
        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };

      axios(config)
        .then(function (response) {
          vm.boolFile = true;
          vm.payPath = JSON.stringify(response.data.data[0].insertid);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    cleanData() {
      this.payfile = "";
      this.date = "";
      this.payPath = "";
      this.factura_pago = "";
      this.serie_pago = "";
      this.banco_pago = "";
      this.moneda_pago = "";
      this.monto_pago = "";
    },

    async _putInvoice() {
      var vm = this;

      var data = {
        id_pago: vm.payPath,
        fecha_pago: vm.date,
        factura_pago: vm.factura_pago,
        serie_pago: vm.serie_pago,
        id_bank_pago: vm.banco_pago,
        id_coin_pago: vm.moneda_pago,
        monto_pago: vm.monto_pago,
        status: 2,
      };

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "paymentInvoiceAdmin/" + vm.id_pro,

        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          //vm.dialogListInvoince = true;
          // vm.itemsListInvoice = response.data.data;
          vm.$swal({
            icon: "success",
            title: "Documento Cargado",
            text: "El documento ha sido cargado correctamente",
          });
          vm.dialogPayment = false;
          vm.cleanData();
          vm._getInvoiceAdmin();
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getInvoiceAdmin(id_proveedor, id_house) {
      var vm = this;
      vm.$store.state.spiner = true;
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getInvoiceAdmin",
        data: {
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        },
        headers: {
         
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          //vm.dialogListInvoince = true;
          vm.itemsListInvoice = response.data.data;
        })
        .catch(function (error) {
          console.log(error);
        });
      vm.$store.state.spiner = false;
    },

    async delPro(id) {
      var vm = this;

      var data = {
        id: id,
      };

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "delPro",

        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm._getInvoiceAdmin();
        })
        .catch(function (error) {
          console.log(error);
        });
    },
  },
};
</script>
<style scoped>
.totalcss {
  background: #adcaf5 !important;
}
.montodolarcss {
  background: #c7f7d7 !important;
}
</style>

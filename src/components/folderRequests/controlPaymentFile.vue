<template>
  <div>
    <v-card elevation="0">
      <v-card-title>
        Pagar Expedientes sin Solicitud
        <v-spacer></v-spacer>
        <v-text-field v-model="search" label="Buscar"></v-text-field>
      </v-card-title>
      <v-card-text>
        <v-data-table
          v-if="$store.state.dataHouse"
          :headers="headers"
          :items="itemsHouseListAll"
          :search="search"
         
        >
          <template v-slot:[`item.actions`]="{ item }">
            <v-icon
              v-if="statusList != '2'"
              large
              color="dark"
              class="mr-2"
              @click="setPayment(item.id, item.nro_master, item.nameconsigner)"
            >
              mdi-cash-check
            </v-icon>

            <!--  <v-icon small color="red" @click="deleteItem(item)">
            mdi-delete
          </v-icon> -->
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialogPayment" max-width="900">
      <v-card>
        <v-card-title>
          Procesar pago para el Expediente {{ nro_master }} de
          {{ nameconsigner }}
        </v-card-title>
        <v-card-text>
          <v-container fluid>
            <v-row dense>
              <v-col cols="12">
                <v-data-table
                  v-model="selected"
                  :headers="headersEgresos"
                  :items="itemsEgresos"
                  item-key="id"
                  show-select
                  class="elevation-0"
                >
                  <template
                    v-slot:[`item.data-table-select`]="{
                      item,
                      isSelected,
                      select,
                    }"
                  >
                    <v-simple-checkbox
                      :value="isSelected"
                      :readonly="item.pagado == 1"
                      :disabled="item.pagado == 1"
                      @input="select($event)"
                    ></v-simple-checkbox>
                  </template>
                  <template v-slot:[`item.status`]="{ item }">
                    <v-chip
                      v-if="item.pagado == 1"
                      class="ma-2"
                      color="green"
                      small
                      text-color="white"
                    >
                      {{ item.status == 1 ? "Pagado" : "" }}
                    </v-chip>

                    <v-icon
                      class="btn__add mr-2"
                      dense
                      large
                      color="grey"
                      v-if="item.pagado == 1"
                      @click.native="openPaymentFile(item.path)"
                      >mdi-eye</v-icon
                    >
                  </template>
                </v-data-table>
              </v-col>
              <v-col cols="12" md="6">
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
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="payoperacion"
                  label="No. Operación"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="4">
                <v-autocomplete
                  :items="$store.state.itemsDataBanksList"
                  v-model="paybanco"
                  item-text="acronym"
                  item-value="id"
                  label="Banco"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" md="4">
                <v-autocomplete
                  :items="$store.state.itemsCoinsList"
                  v-model="paymoneda"
                  item-text="acronym"
                  item-value="id"
                  label="Moneda"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="paymonto"
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
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            @click="_setSPaymentFile()"
            :disabled="!boolFile"
            >GUARDAR PAGO</v-btn
          >
          <v-spacer></v-spacer>
          <v-btn outlined color="red" @click="dialogPayment = !dialogPayment"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import { mapState, mapActions } from "vuex";
import axios from '@/api/axios-config';
export default {
  name: "ControlPaymentFile",
  data: () => ({
    search: "",
    dialogPayment: false,
    nameconsigner: "",

    radio: 1,
    boolFile: false,
    dialogListInvoince: false,
    ayoperacion: "",
    paybanco: "",
    paymoneda: "",
    paymonto: "",
    payfile: "",
    payPath: "",
    payfile: "",
    pathfile: "",
    paymentname: "",
    paymentMaster: "",
    paymentmonto: "",
    payPath: "",
    item: "",
    pathfileAll: "",
    date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .substr(0, 10),
    menu: false,
    modal: false,
    menu2: false,

    id_house: "",

    nro_master: "",

    itemsEgresos: [],
    selected: [],

    headersEgresos: [
      { text: "Concepto", value: "concepto" },

      { text: "Monto Pricing", value: "total_pr" },
      { text: "Monto Operaciones", value: "total_op" },
      { text: "Status", value: "status" },
    ],

    headers: [
      { text: "Master", value: "code_master" },
      {
        text: "Codigo",
        align: "start",
        value: "code_house",
      },

      { text: "Expediente", value: "nro_master" },
      { text: "Sentido", value: "namemodality" },
      { text: "Origen", value: "nameportbegin" },
      { text: "Destino", value: "nameportend" },

      { text: "Consignatario", value: "nameconsigner" },
      { text: "Fecha Disponibilidad", value: "fecha_disponibilidad" },

      { text: "Notify", value: "namenotify" },
      { text: "Pagado", value: "pagadode" },

      { text: "Pagar", value: "actions" },
    ],
  }),
  mounted() {
    this._getHouseListAll();
  },
  computed: {
    ...mapState(["itemsHouseListAll"]),
  },
  methods: {
    ...mapActions(["_getHouseListAll", "_getHouseListAll"]),

    editHouse(id) {
      this.$router.push("/home/folderHouse/control/" + id);
    },
    selectHouse(id) {
      this.$router.push("/home/folderBilling/billControlGastos/" + id);
    },
    setPayment(id, nro_master, nameconsigner) {
      this.nro_master = nro_master;
      this.nameconsigner = nameconsigner;
      this.id_house = id;
      this.getEgresosExpedientes();
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

    openPaymentFile(path) {
      window.open(path, "_blank");
    },

    async _setSPaymentFile() {
      var vm = this;
      vm.$swal({
        icon: "info",
        title: "Procesando pago...",
        text: "Por favor espere",
      });
      var data = {
        fecha_operacion: vm.date,
        nro_operacion: vm.payoperacion,
        id_banks: vm.paybanco,
        id_coins: vm.paymoneda,
        monto: vm.paymonto,
        id_path: vm.payPath,
        status: 1,
        id_request: "",
        itemsSPaymentConceptos: vm.selected,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "setSPaymentFile/",

        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          //vm.itemsSPayment = response.data.data;
          vm.$swal({
            icon: "success",
            title: "Pago Procesado",
            text: "El pago ha sido procesado correctamente",
          });

          vm.cleandData();
          vm.dialogProcess = false;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    cleandData() {
      this.date = "";
      this.payoperacion = "";
      this.paybanco = "";
      this.paymoneda = "";
      this.paymonto = "";
      this.payPath = [];
      this.payFile = "";
      this.pathfile = "";
      this.boolFile = false;
      this.selected = [];

      setTimeout(() => {
        this.getEgresosExpedientes();
      }, 1000);
    },
    getEgresosExpedientes() {
      var vm = this;

      var data = {
        id_house: vm.id_house,
      };
      var config = {
        method: "post",
        url:
          process.env.VUE_APP_URL_MAIN + "getEgresosExpediente/" + vm.id_house,
        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios(config)
        .then(function (response) {
          vm.itemsEgresos = response.data.data;
          vm.dialogPayment = true;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
  },
};
</script>

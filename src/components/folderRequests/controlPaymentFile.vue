<template>
  <div>
    <v-card elevation="0">
      <v-card-title class="d-flex align-center flex-wrap">
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
              size="large"
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
            <v-row density="compact">
              <v-col cols="12">
                <v-data-table
                  v-model="selected"
                  :headers="headersEgresos"
                  :items="itemsEgresos"
                  item-value="id"
                  return-object
                  show-select
                  class="elevation-0"
                >
                  <template
                    v-slot:[`item.data-table-select`]="{ item, props }"
                  >
                    <v-checkbox-btn
                      v-bind="props"
                      :readonly="item.pagado == 1"
                      :disabled="item.pagado == 1"
                    ></v-checkbox-btn>
                  </template>
                  <template v-slot:[`item.status`]="{ item }">
                    <v-chip
                      v-if="item.pagado == 1"
                      class="ma-2 text-white"
                      color="green"
                      size="small"
                      variant="flat"
                    >
                      {{ item.status == 1 ? "Pagado" : "" }}
                    </v-chip>

                    <v-icon
                      class="btn__add mr-2"
                      size="large"
                      color="grey"
                      v-if="item.pagado == 1"
                      @click="openPaymentFile(item.path)"
                      >mdi-eye</v-icon
                    >
                  </template>
                </v-data-table>
              </v-col>
              <v-col cols="12" md="6">
                <v-menu
                  v-model="menu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  min-width="auto"
                >
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-model="date"
                      label="Fecha de Operación"
                      prepend-icon="mdi-calendar"
                      readonly
                     
                      v-bind="props"
                    ></v-text-field>
                  </template>
                  <v-locale-provider locale="es">
                    <v-date-picker
                      :model-value="date || undefined"
                      @update:model-value="setDate"
                      hide-header
                    >
                      <template #actions>
                        <v-spacer></v-spacer>
                        <v-btn variant="text" color="primary" @click="menu = false">
                          Cancel
                        </v-btn>
                        <v-btn variant="text" color="primary" @click="dateOnOpen = date; menu = false">
                          OK
                        </v-btn>
                      </template>
                    </v-date-picker>
                  </v-locale-provider>
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
                  item-title="acronym"
                  item-value="id"
                  label="Banco"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" md="4">
                <v-autocomplete
                  :items="$store.state.itemsCoinsList"
                  v-model="paymoneda"
                  item-title="acronym"
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
                  size="large"
                  class=""
                  color="success"
                  variant="outlined"
                >
                  <v-icon start> mdi-check </v-icon>
                  Archivo cargado éxitosamente
                </v-chip>
              </v-col>
              <v-col cols="3">
                <v-btn
                  :disabled="boolFile || payfile == []"
                  color="blue-grey"
                  block
                  class="ma-2 text-white"
                  size="large"
                  @click="_uploadFile()"
                >
                  Subir
                  <v-icon end> mdi-cloud-upload </v-icon>
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
          <v-btn variant="outlined" color="red" @click="dialogPayment = !dialogPayment"
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
import moment from "moment";
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
    dateOnOpen: null,
    modal: false,
    menu2: false,

    id_house: "",

    nro_master: "",

    itemsEgresos: [],
    selected: [],

    headersEgresos: [
      { title: "Concepto", key: "concepto" },

      { title: "Monto Pricing", key: "total_pr" },
      { title: "Monto Operaciones", key: "total_op" },
      { title: "Status", key: "status" },
    ],

    headers: [
      { title: "Master", key: "code_master" },
      {
        title: "Codigo",
        align: "start",
        key: "code_house",
      },

      { title: "Expediente", key: "nro_master" },
      { title: "Sentido", key: "namemodality" },
      { title: "Origen", key: "nameportbegin" },
      { title: "Destino", key: "nameportend" },

      { title: "Consignatario", key: "nameconsigner" },
      { title: "Fecha Disponibilidad", key: "fecha_disponibilidad" },

      { title: "Notify", key: "namenotify" },
      { title: "Pagado", key: "pagadode" },

      { title: "Pagar", key: "actions" },
    ],
  }),
  mounted() {
    this._getHouseListAll();
  },
  computed: {
    ...mapState(["itemsHouseListAll"]),
  },
  watch: {
    menu(open) {
      if (open) this.dateOnOpen = this.date;
      else this.date = this.dateOnOpen;
    },
  },
  methods: {
    ...mapActions(["_getHouseListAll", "_getHouseListAll"]),
    setDate(value) {
      this.date = moment(value).format("YYYY-MM-DD");
    },

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
      var data = new FormData();
      var vm = this;
      data.append("name", "Prueba");
      data.append("file", vm.payfile);

      var config = {
        method: "post",
        url: import.meta.env.VUE_APP_URL_MAIN + "uploadAllPath",
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
          console.error(error);
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
        url: import.meta.env.VUE_APP_URL_MAIN + "setSPaymentFile/",

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
          console.error(error);
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
          import.meta.env.VUE_APP_URL_MAIN + "getEgresosExpediente/" + vm.id_house,
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
          console.error(error);
        });
    },
  },
};
</script>

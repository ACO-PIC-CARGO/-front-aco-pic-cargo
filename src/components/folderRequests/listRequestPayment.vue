<template>
  <div>
    <v-card elevation="0" class="mx-auto">
      <v-card-title>
        <h3>Solicitudes de Pago</h3>
      </v-card-title>
      <v-card-subtitle>
        <v-row>
          <v-col cols="6">
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="Buscar solicitud"
            ></v-text-field>
          </v-col>
          <v-col cols="6" class="ml-auto">
            <v-btn text color="orange" @click="abrirPagoProveedor()">
              NUEVO PAGO
              <v-icon> mdi-cash-check </v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-subtitle>
      <v-container v-if="!dataList" style="height: 400px">
        <v-row class="fill-height" align-content="center" justify="center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            Cargando informacíon
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple accent-4"
              indeterminate
              rounded
              height="6"
            ></v-progress-linear>
          </v-col>
        </v-row>
      </v-container>
      <v-data-table
        v-if="dataList"
        :headers="headersPdf"
        :items="itemsSPayment"
        :search="search"
      >
        <template v-slot:[`item.status`]="{ item }">
          <v-chip
            v-if="item.status == 2 && item.ajusteflag == 0"
            class="ma-2"
            color="orange"
            text-color="white"
          >
            {{ item.status == 2 ? "Pendiente" : "" }}
          </v-chip>
          <v-chip
            v-if="item.status == 3 && item.ajusteflag == 0"
            class="ma-2"
            color="green"
            text-color="white"
          >
            {{ item.status == 3 ? "Pagado" : "" }}
          </v-chip>
          <v-chip
            v-if="item.ajusteflag == 1"
            class="ma-2"
            color="blue"
            text-color="white"
          >
            AJUSTADO
          </v-chip>
        </template>
        <!-- <template v-else>
          <v-chip class="ma-2" color="blue" text-color="white">
            AJUSTADO
          </v-chip>
        </template> -->
        <template v-slot:[`item.accion`]="{ item }">
          <v-icon class="mr-2" @click="viewPdf(item.path)"> mdi-eye </v-icon>
        </template>
        <template v-slot:[`item.pago_completo`]="{ item }">
          <v-chip
            v-if="item.pago_completo == 0"
            class="ma-2"
            color="orange"
            text-color="white"
          >
            {{ item.pago_completo == 0 ? "POR COBRAR" : "" }}
          </v-chip>
          <v-chip
            v-if="item.pago_completo == 1"
            class="ma-2"
            color="green"
            text-color="white"
          >
            {{ item.pago_completo == 1 ? "COBRADO" : "" }}
          </v-chip>
        </template>
        <template v-slot:[`item.invoice`]="{ item }">
          <v-icon
            class="mr-2"
            @click="
              openInvoice(item.id_proveedor, item.id_house, item.namelong)
            "
          >
            mdi-eye
          </v-icon>
        </template>
        <template v-slot:[`item.inst`]="{ item }">
          <v-icon class="mr-2" @click="editControl(item.code_master)">
            mdi-eye
          </v-icon>
        </template>
        <template v-slot:[`item.accions`]="{ item }">
          <v-icon
            v-if="item.status == 3 && security == 1"
            color="blue-grey darken-2"
            class="mr-2"
            @click="reversar(item)"
          >
            mdi-undo-variant
          </v-icon>

          <v-icon
            v-if="item.status == 3"
            large
            color="green"
            class="mr-2"
            @click="openPaymentFile(item.id, item.pathfile, item.namelong)"
          >
            mdi-eye
          </v-icon>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog width="700" persistent v-model="dialogProcess">
      <v-card>
        <v-card-title>
          <h3>
            Procesar Pago del Exp. {{ paymentMaster }} por el Monto de
            {{ paymentmonto }} USD <br />
            {{ nameproveedor }}
          </h3>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row dense>
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
            >Procesar Pago</v-btn
          >
          <v-spacer></v-spacer>
          <v-btn outlined color="red" @click="dialogProcess = !dialogProcess"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog max-width="800" v-model="dialogListInvoince">
      <v-card>
        <v-card-title>
          Facturas y Performance de {{ nameproveedor }}
          <v-spacer></v-spacer>
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersInvoice"
            :items="itemsListInvoice"
            dense
            item-key="id"
            class="elevation-0"
          >
            <template v-slot:[`item.originalname`]="{ item }">
              <v-icon v-if="item.type == 'pdf'" color="red" class="mr-2"
                >mdi-file-pdf</v-icon
              >
              <v-icon
                v-if="
                  item.type == 'png' ||
                  item.type == 'jpg' ||
                  item.type == 'jpeg'
                "
                color="blue-grey darken-1
"
                class="mr-2"
                >mdi-file-image</v-icon
              >
              {{ item.type_pago == 1 ? "FACTURA" : "PERFORMANCE" }} -
              {{ item.number }}
            </template>
            <template v-slot:[`item.path`]="{ item }">
              <v-icon
                class="btn_add mr-2"
                dense
                large
                color="grey"
                @click="openDoc(item.path)"
                >mdi-eye</v-icon
              >
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog width="80%" v-model="dialogPath">
      <v-card>
        <v-card-title> </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="4">
              <h2>Proveedor</h2>
              <p class="text-h4 mt-2">{{ nameproveedor }}</p>
              <h2>Conceptos pagados</h2>
              <p
                v-for="item in itemsSPaymentConceptos"
                :key="item.id"
                class="mt-5"
              >
                {{ item.name }}
              </p>
            </v-col>
            <v-col cols="8">
              <iframe
                :src="pathfileAll"
                width="100%"
                height="800px"
                frameborder="0"
              ></iframe>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogPagoControlGasto"
      max-width="80%"
      fullscreen
      transition="dialog-transition"
      persistent
      v-if="dialogPagoControlGasto"
    >
      <ModalPagoControlGastoComponent
        :limpar="true"
        @cerrarModal="onCerrarModal"
        @cancelar="dialogPagoControlGasto = false"
      />
    </v-dialog>
  </div>
</template>
<script>
import axios from "axios";
import Swal from "sweetalert2";
import { mapActions, mapState } from "vuex";
export default {
  props: ["filtrarFlag"],
  name: "RequestPayment",
  components: {
    ModalPagoControlGastoComponent: () =>
      import("../../components/modal/modalPagoControlGasto.vue"),
  },
  data: () => ({
    itemsSPayment: [],
    search: "",
    dialogPagoControlGasto: false,
    dialogProcess: false,
    idProveedor: 184,
    date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .substr(0, 10),
    menu: false,
    modal: false,
    menu2: false,
    security: JSON.parse(sessionStorage.getItem("security")),
    payoperacion: "",
    paybanco: "",
    paymoneda: "",
    paymonto: "",
    payfile: "",
    itemsSPaymentConceptos: [],
    dialogPath: false,
    pathfile: "",
    sPaymentId: "",
    paymentname: "",
    paymentMaster: "",
    paymentmonto: "",
    payPath: "",
    nameproveedor: "",
    dialogListInvoince: false,
    itemsListInvoice: [],

    pathfileAll: "",
    boolFile: false,

    headersInvoice: [
      {
        text: "Nombre",
        value: "originalname",
      },
      {
        text: "Fecha",
        value: "date_letra",
      },
      {
        text: "Ver",
        value: "path",
      },
    ],

    headersPdf: [
      /* {
        text: "Nombre",

        value: "path",
      }, */
      {
        text: "Expediente",
        value: "nro_master",
      },
      {
        text: "Fecha de Disponibilidad",
        value: "fecha_disponibilidad",
      },
      {
        text: "Proveedor",
        value: "name_proveedor",
      },
      {
        text: "Quote",
        value: "id_cot",
      },
      {
        text: "Monto",
        value: "monto_letra",
      },
      {
        text: "Consignatario",
        value: "name_cosigner",
      },
      {
        text: "Ver Facturas",
        value: "invoice",
      },
      {
        text: "Ver Solicitud",
        value: "accion",
      },

      {
        text: "Ver Instructivo",
        value: "inst",
      },
      {
        text: "Status de Cobro al cliente",
        value: "pago_completo",
      },
      {
        text: "Ganancia",
        value: "ganancia",
      },

      {
        text: "Status",
        value: "status",
      },

      {
        text: "Cargar Soporte de Pago",
        value: "accions",
      },
    ],
    dataList: false,
  }),
  async mounted() {
    this.$store.state.spiner = true;
    await this._getRequestPayment();
    await this._getBanksList();
    await this._getCoinsList();
    this.$store.state.spiner = false;
  },
  methods: {
    ...mapActions(["_getBanksList", "_getCoinsList"]),
    onCerrarModal(cerrar) {
      if (cerrar) {
        this.dialogPagoControlGasto = !cerrar;
      }
    },
    processPayment(id, path, master, monto, namelong) {
      this.sPaymentId = id;
      this.paymentname = path;
      this.paymentMaster = master;
      this.paymentmonto = monto;
      this.nameproveedor = namelong;
      this._getRequestPaymentConceptos(this.sPaymentId);
      this.dialogProcess = true;
    },
    openDoc(path) {
      window.open(path, "_blank");
    },
    openPaymentFile(id, path, proveedor) {
      this.pathfileAll = path;
      this.dialogPath = true;
      this.nameproveedor = proveedor;
      this._getRequestPaymentConceptos(id);
    },
    openInvoice(id, id_house, nameproveedor) {
      this._getInvoice(id, id_house);
      this.nameproveedor = nameproveedor;
      //this.dialogInvoice = true;
    },
    async _getInvoice(id_proveedor, id_house) {
      var vm = this;
      var data = {
        id_house: id_house,
        id_proveedor: id_proveedor,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getListInvoice",

        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.dialogListInvoince = true;
          vm.itemsListInvoice = response.data.data;
        })
        .catch(function (error) {
          console.log(error);
        });
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
          "auth-token": sessionStorage.getItem("auth-token"),
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
    editControl(nro_master) {
      window.open(
        "/home/folderBilling/editControlGastos/view/" + nro_master,
        "Instructivo",
        "width=1593,height=1293",
        "menubar=no",
        "location=no",
        "resizable=no",
      );
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

      setTimeout(() => {
        this._getRequestPayment();
      }, 1000);
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
        id_request: vm.sPaymentId,
        itemsSPaymentConceptos: vm.itemsSPaymentConceptos,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "setSPaymentFile/",

        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
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
    async _getRequestPayment() {
      var vm = this;
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getRequestPayment",
        data: {
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        },
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm.itemsSPayment = response.data.data;
          vm.dataList = true;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _getRequestPaymentConceptos(id) {
      var vm = this;
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getRequestPaymentConceptos/" + id,

        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm.itemsSPaymentConceptos = response.data.data;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    viewPdf(pdf) {
      window.open(process.env.VUE_APP_URL_MAIN + pdf, "_blank");
    },
    abrirPagoProveedor(id) {
      // this.idProveedor = id;
      this.$store.state.files.payPath = null;
      this.dialogPagoControlGasto = true;
      this.$store.state.limpiar = !this.$store.state.limpiar;
    },
    async reversar(item) {
      Swal.fire({
        title: "Aviso",
        text: "¿Esta seguro que quiere reversar la confirmación de esta cuenta por pagar?",
        icon: "question",
        confirmButtonText: "Si",
        denyButtonText: "No",
        showDenyButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
          this.reversarProceso(item);
        }
      });
    },
    async reversarProceso(item) {
      let vm = this;
      var config = {
        method: "put",
        url: process.env.VUE_APP_URL_MAIN + "reversar_debsproveedor",

        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: { id: item.id },
      };
      await axios(config)
        .then(function (response) {
          let res = response.data.data;

          Swal.fire({
            title: "Aviso",
            text: res[0].mensaje,
            icon: "info",
          });
          vm.getDebs();
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async getDebs() {
      this.$store.state.spiner = true;
      await this._getRequestPayment();
      this.$store.state.spiner = false;
    },
  },
  computed: {
    ...mapState(["actualizar"]),
  },
  watch: {
    filtrarFlag() {
      if (this.filtrarFlag == true) {
        this.itemsSPayment = this.itemsSPayment.filter((v) => v.status == 2);
      }
    },
    actualizar() {
      this.dataList = false;
      this.itemsSPayment = [];
      setTimeout(() => {
        this._getRequestPayment();
        this._getBanksList();
        this._getCoinsList();
      }, 100);
    },
  },
};
</script>

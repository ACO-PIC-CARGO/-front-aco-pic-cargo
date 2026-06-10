<template>
  <div>
    <h3>Total por Proveedores</h3>

    <v-dialog width="780" v-model="dialogSolicitud">
      <v-stepper v-model="e1">
        <v-stepper-header>
          <v-stepper-step :complete="e1 > 1" step="1"> Códigos </v-stepper-step>

          <v-divider></v-divider>

          <v-stepper-step :complete="e1 > 2" step="3">
            Cuentas Bancarias
          </v-stepper-step>
          <v-divider></v-divider>

          <v-stepper-step :complete="e1 > 3" step="3">
            Observaciones
          </v-stepper-step>
        </v-stepper-header>

        <v-stepper-items>
          <v-stepper-content step="1">
            <v-card class="mb-12" elevation="0" height="200px">
              <v-card-text>
                <v-row dense>
                  <v-col md="6" cols="12">
                    <v-checkbox
                      v-model="checkPago"
                      label="Aplica código de pago"
                    ></v-checkbox>
                    <v-text-field
                      v-if="checkPago"
                      v-model="codigo_pago"
                      label="CODIGO DE PAGO"
                      >CODIGO DE PAGO</v-text-field
                    >
                  </v-col>
                  <v-col md="6" cols="12">
                    <v-checkbox
                      v-model="checkMaster"
                      label="Aplica Número de Expediente"
                    ></v-checkbox>
                    <v-text-field
                      v-if="checkMaster"
                      v-model="codigo_master"
                      label="CODIGO DE MASTER BL"
                      >CODIGO DE MASTER BL</v-text-field
                    >
                  </v-col>
                </v-row>
              </v-card-text></v-card
            >

            <v-btn color="primary" @click="e1 = 2"> Continuar </v-btn>

            <v-btn text @click="e1 = 1"> Volver </v-btn>
            <v-btn text @click="dialogSolicitud = false"> Cerrar </v-btn>
          </v-stepper-content>

          <v-stepper-content step="2">
            <v-card class="mb-12" elevation="0" height="200px">
              <v-card-text>
                <b>Cuentas</b>
                <v-data-table
                  v-if="!checkPago"
                  v-model="selectedAccount"
                  :headers="headersAccount"
                  :items="$store.state.itemsDataAccountsNumberList"
                  hide-default-footer
                  item-key="id"
                  show-select
                  class="elevation-0"
                  dense
                >
                </v-data-table>
                <h2 class="mt-5">Ya seleccionó el codigo de pago</h2>
              </v-card-text></v-card
            >

            <v-btn color="primary" @click="e1 = 3"> Continuar </v-btn>

            <v-btn text @click="e1 = 1"> Volver</v-btn>
            <v-btn text @click="dialogSolicitud = false"> Cerrar </v-btn>
          </v-stepper-content>

          <v-stepper-content step="3">
            <v-card class="mb-12" elevation="0" height="200px">
              <v-card-text>
                <v-textarea
                  v-model="comentarios"
                  rows="3"
                  label="Observación Adicionales"
                >
                </v-textarea>
                <v-btn
                  block
                  @click.native="_generateSolicitud()"
                  class="mt-2"
                  color="primary"
                  >GENERAR SOLICITUD</v-btn
                >
              </v-card-text></v-card
            >

            <v-btn text @click="e1 = 2"> Volver </v-btn>
            <v-btn text @click="dialogSolicitud = false"> Cerrar </v-btn>
          </v-stepper-content>
        </v-stepper-items>
      </v-stepper>
    </v-dialog>

    <v-dialog width="680" v-model="dialogSolicitudDivision">
      <v-card>
        <v-card-title> Solicitar pago por concepto</v-card-title>

        <v-card-text>
          <v-row dense>
            <v-col md="6" cols="12">
              <v-text-field v-model="codigo_pago" label="CODIGO DE PAGO"
                >CODIGO DE PAGO</v-text-field
              >
            </v-col>
            <v-col md="6" cols="12">
              <v-text-field v-model="codigo_master" label="CODIGO DE MASTER BL"
                >CODIGO DE MASTER BL</v-text-field
              >
            </v-col>
          </v-row>

          <v-textarea
            v-model="comentarios"
            rows="3"
            label="Observación Adicionales"
          >
          </v-textarea>

          <h2>Seleccione los conceptos</h2>

          <v-data-table
            v-model="selected"
            :headers="headers"
            hide-default-header
            :items="$store.state.itemsDataConceptos"
            hide-default-footer
            item-key="concepto"
            :footer-props="{
              'items-per-page-options': [10, 20, 30, 40, 50],
            }"
            :items-per-page="30"
            dense
            show-select
            class="elevation-0"
          >
            <template
              v-slot:[`item.data-table-select`]="{ item, isSelected, select }"
            >
              <v-simple-checkbox
                :value="isSelected"
                :readonly="item.pagado == 1"
                v-if="!item.pagado == 1"
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

          <b>Cuentas</b>
          <v-data-table
            v-model="selectedAccount"
            :headers="headersAccount"
            :items="$store.state.itemsDataAccountsNumberList"
            hide-default-footer
            item-key="id"
            show-select
            dense
            class="elevation-0"
          >
          </v-data-table>

          <v-btn
            block
            @click.native="_generateSolicitud()"
            class="mt-2"
            color="primary"
            >GENERAR SOLICITUD</v-btn
          >
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog width="70%" v-model="dialogPayment">
      <v-card class="mx-auto">
        <v-toolbar color="cyan" dark>
          <v-toolbar-title>SOLICITUDES GENERADAS</v-toolbar-title>

          <v-spacer></v-spacer>
        </v-toolbar>
        <v-card-title>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Buscar solicitud"
            single-line
            hide-details
          ></v-text-field>
        </v-card-title>
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
              v-if="item.status == 2"
              class="ma-2"
              color="orange"
              text-color="white"
            >
              {{ item.status == 2 ? "Pendiente" : "" }}
            </v-chip>
            <v-chip
              v-if="item.status == 3"
              class="ma-2"
              color="green"
              text-color="white"
            >
              {{ item.status == 3 ? "Pagado" : "" }}
            </v-chip>
          </template>
          <template v-slot:[`item.accion`]="{ item }">
            <v-icon class="mr-2" @click="viewPdf(item.path)"> mdi-eye </v-icon>
          </template>
          <template v-slot:[`item.accions`]="{ item }">
            <v-icon
              v-if="item.status != 3"
              class="mr-2"
              @click="sendAdmin(item.id)"
            >
              mdi-send
            </v-icon>
          </template>
        </v-data-table>
      </v-card>
    </v-dialog>

    <v-dialog max-width="800" v-model="dialogListInvoince">
      <v-card>
        <v-card-title>
          Facturas y Performance de {{ nameproveedor }}
          <v-spacer></v-spacer>
          <v-btn outlined @click="dialogInvoice = true" color="primary"
            >Cargar Nueva</v-btn
          >
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
              {{
                item.type_pago == 1
                  ? "FACTURA"
                  : "" || item.type_pago == 2
                  ? "PERFORMANCE"
                  : "OTRO"
              }}
              -
              {{ item.number }}
            </template>
            <template v-slot:[`item.path`]="{ item }">
              <v-icon
                class="btn_add mr-2"
                dense
                large
                color="grey"
                @click.native="openDoc(item.path)"
                >mdi-eye</v-icon
              >
            </template>
            <template v-slot:[`item.action`]="{ item }">
              <v-icon
                class="btn_add mr-2"
                dense
                large
                color="red"
                @click.native="_delInvoice(item.id)"
                >mdi-delete</v-icon
              >
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog width="800" v-model="dialogInvoice">
      <v-card>
        <v-card-title>
          <h3>Subir factura o proforma para {{ nameproveedor }}</h3>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row dense>
              <v-col cols="12" md="12">
                <v-radio-group v-model="radio" row>
                  <v-radio label="Factura" value="1"></v-radio>
                  <v-radio label="Performance" value="2"></v-radio>
                  <v-radio label="Otro" value="3"></v-radio>
                </v-radio-group>
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
                      :label="`Fecha de ${
                        radio == 1
                          ? 'Factura'
                          : '' || radio == 2
                          ? 'Performance'
                          : 'Otro'
                      }`"
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
                  v-model="nro_invoice"
                  :label="`Nro de ${
                    radio == 1
                      ? 'Factura'
                      : '' || radio == 2
                      ? 'Performance'
                      : 'Otro'
                  }`"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="7">
                <v-file-input
                  v-if="!boolFile"
                  v-model="payfile"
                  show-size
                  :label="`Adjuntar File de ${
                    radio == 1
                      ? 'Factura'
                      : '' || radio == 2
                      ? 'Performance'
                      : 'Otro'
                  }`"
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
              <v-col cols="5">
                <v-btn
                  :disabled="boolFile || payfile == []"
                  color="blue-grey"
                  block
                  class="ma-2 white--text"
                  large
                  @click="_uploadFile()"
                >
                  Subir
                  {{
                    radio == 1
                      ? "Factura"
                      : "" || radio == 2
                      ? "Performance"
                      : "Otro"
                  }}
                  <v-icon right dark> mdi-cloud-upload </v-icon>
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="_setInvoice()" :disabled="!boolFile">
            GUARDAR
            {{
              radio == 1 ? "Factura" : "" || radio == 2 ? "Performance" : "Otro"
            }}</v-btn
          >

          <v-btn outlined color="red" @click="dialogInvoice = !dialogInvoice">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-simple-table dense max-height="440" fixed-header>
      <template v-slot:default>
        <thead>
          <tr>
            <th class="text-left">Proveedor</th>
            <th class="text-left">Total Pricing</th>
            <th class="text-left">Total Operaciones</th>
            <th class="text-left">Facturas o Proformance</th>

            <th class="text-left">Generar PDF de pago</th>
            <th class="text-left">Solicitar a Administración</th>
          </tr>
        </thead>
        <tbody>
          <tr
            :style="`background:${item.color}`"
            v-for="item in $store.state.itemsDataTotalesProveedor"
            :key="item.id"
          >
            <td>{{ item.nameproveedor }}</td>
            <td>{{ item.total_pr }}</td>
            <td>{{ item.total_op }}</td>
            <td>
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    v-bind="attrs"
                    v-on="on"
                    @click.native="
                      openInvoice(
                        item.id_proveedor,
                        item.nameproveedor,
                        item.type
                      )
                    "
                    elevation="0"
                    small
                    color="white"
                    ><v-icon :color="item.docs > 0 ? 'blue' : 'grey'"
                      >mdi-file-compare</v-icon
                    ></v-btn
                  >
                </template>
                <span>{{ item.docs }}</span>
              </v-tooltip>
            </td>
            <td>
              <v-btn
                @click.native="
                  solicitar(
                    item.nameproveedor,
                    item.total_op,
                    item.id_proveedor,
                    item.type
                  )
                "
                elevation="0"
                small
                color="white"
                ><v-icon color="blue">mdi-send</v-icon></v-btn
              >
            </td>
            <td>
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    v-bind="attrs"
                    v-on="on"
                    @click.native="openPayments(item.id_proveedor, item.type)"
                    elevation="0"
                    small
                    color="white"
                    ><v-icon :color="item.solicitudes > 0 ? 'blue' : 'grey'"
                      >mdi-email-send</v-icon
                    ></v-btn
                  >
                </template>
                <span>{{ item.solicitudes }}</span>
              </v-tooltip>
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
  </div>
</template>
<script>
import axios from '@/api/axios-config';;
import { mapState, mapActions } from "vuex";
export default {
  name: "services",
  data: () => ({
    dialogSolicitud: false,
    dialogSolicitudDivision: false,
    nameproveedorLocal: "",
    TotalLocal: "",
    proveedorId: "",
    comentarios: "",
    codigo_pago: "",
    codigo_master: "",
    active: true,
    selected: [],
    selectedAccount: [],
    total: 0,
    e1: 1,
    dataList: false,
    dialogInvoice: false,
    radio: 1,
    boolFile: false,
    dialogListInvoince: false,
    payPath: "",
    payfile: "",
    item: "",
    date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .substr(0, 10),
    menu: false,
    modal: false,
    menu2: false,

    nro_invoice: "",

    checkPago: false,
    checkMaster: false,

    proveedorId: "",

    nameproveedor: "",

    singleSelect: false,
    selected: [],
    dialogPayment: false,
    itemsSPayment: [],
    itemsListInvoice: [],

    itemsInvoice: [],
    search: "",
    headers: [
      {
        text: "Concepto",
        align: "start",
        sortable: false,

        value: "concepto",
      },
      {
        text: "Monto",

        value: "monto_op",
      },
      {
        text: "Status",

        value: "status",
      },
    ],
    sPaymentId: "",

    headersPdf: [
      {
        text: "Nombre",
        align: "start",
        sortable: false,
        value: "path",
      },
      {
        text: "Fecha Creado",
        value: "fecha_letra",
      },
      {
        text: "Hora Creado",
        value: "hora_letra",
      },
      {
        text: "Fecha de Solicitud",
        value: "fecha_sol_letra",
      },
      {
        text: "Fecha de Pago",
        value: "fecha_pago_letra",
      },
      {
        text: "Ver",
        value: "accion",
      },
      {
        text: "Status",
        value: "status",
      },
      {
        text: "Enviar",
        value: "accions",
      },
    ],

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
      {
        text: "Acción",
        value: "action",
      },
    ],

    headersAccount: [
      {
        text: "Cuenta",
        align: "start",
        sortable: false,
        value: "nameaccount",
      },
      { text: "Banco", value: "namebanks" },
      { text: "Moneda", value: "namecoins" },
      { text: "Número de cuenta", value: "accountnumber" },
    ],
  }),
  mounted() {
    this._validaData();
  },
  computed: {
    ...mapState(["itemsDataTotalesProveedor", "actualizar"]),
  },

  methods: {
    ...mapActions(["_getProveedor", "_getTotalesProveedor"]),
    openDoc(path) {
      window.open(path, "_blank");
    },
    cleandData() {
      this.nro_invoice = "";
      this.payfile = [];
      this.boolFile = false;
    },
    openInvoice(id, nameproveedor, type) {
      var vm = this;
      vm.itemsListInvoice = [];
      if (type == 1) {
        vm.proveedorId = id;

        vm._getInvoice();
        vm.nameproveedor = nameproveedor;
      } else {
        vm.proveedorId = id;

        vm._getInvoice();
        vm.nameproveedor = nameproveedor;
        //vm.dialogInvoice = true;
      }
    },
    async _getInvoice() {
      var vm = this;
      var data = {
        id_house: vm.$route.params.id_house,
        id_proveedor: vm.proveedorId,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `list_invoice_path/${vm.$route.params.id_house}/${vm.proveedorId}`,

        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.dialogListInvoince = true;
          if (!!response.data.data[0].estadoflag) {
            vm.itemsListInvoice = response.data.data;
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _setInvoice() {
      var vm = this;
      vm.$swal({
        icon: "info",
        title: "Guardando...",
        text: "Por favor espere",
      });
      var data = {
        id_house: vm.$route.params.id_house,
        id_proveedor: vm.proveedorId,
        id_path: vm.payPath,
        type_pago: vm.radio,
        number: vm.nro_invoice,
        date: vm.date,
        status: 1,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "setInvoice",

        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.itemsInvoice = response.data.data;
          vm._getTotalesProveedor();
          vm.$swal({
            icon: "success",
            title: "Documento Cargado",
            text: "El documento ha sido cargado correctamente",
          });

          vm.cleandData();
          vm._getInvoice();
          vm.dialogInvoice = false;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async _delInvoice(id) {
      var vm = this;

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "delInvoice/" + id,

        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm.itemsInvoice = response.data.data;

          vm._getInvoice();
          vm.dialogInvoice = false;
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
    openPayments(id, type) {
      var vm = this;

      if (type == 1) {
        vm.$swal({
          icon: "warning",
          title: "Lo sentimos",
          text: "No puede realizar solicitudes hasta colocar un proveedor real.",
        });
      } else {
        vm._getSPaymentPro(id);
        vm.sPaymentId = id;
        vm.dataList = false;
        vm.dialogPayment = true;
      }
    },
    viewPdf(pdf) {
      window.open(process.env.VUE_APP_URL_MAIN + pdf, "_blank");
    },
    async _getAccountsNumber() {
      var vm = this;
      let data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url:
          process.env.VUE_APP_URL_MAIN + "getAccountsNumber/" + vm.proveedorId,
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.$store.state.itemsDataAccountsNumberList = response.data.data;
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    sendAdmin(id) {
      this.$swal({
        title: "¿Desea realizar esta solicitud a Administración?",
        showDenyButton: true,

        confirmButtonText: "Si",
        denyButtonText: `No`,

        icon: "info",
      }).then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          var data = {
            fecha_sol: new Date(
              Date.now() - new Date().getTimezoneOffset() * 60000
            )
              .toISOString()
              .substr(0, 10),
            status: 2,
          };
          var config = {
            method: "post",
            url: process.env.VUE_APP_URL_MAIN + "putSPaymentPro/" + id,
            headers: {
              "auth-token": sessionStorage.getItem("auth-token"),
              "Content-Type": "application/json",
            },
            data: data,
          };

          var vm = this;

          axios(config)
            .then(function (response) {
              vm.$swal({
                icon: "success",
                title: "Excelente",
                text: "Solicitud enviada correctamente",
              });

              vm._getSPaymentPro(vm.sPaymentId);
            })
            .catch(function (error) {
              console.log(error);
            });
        }
      });

      this._getAccountsNumber();

      this.nameproveedorLocal = nameproveedor;
      this.TotalLocal = pagar;
    },

    async _getSPaymentPro(id) {
      var vm = this;

      var config = {
        method: "post",
        url:
          process.env.VUE_APP_URL_MAIN +
          "getSPaymentPro/" +
          vm.$route.params.id_house +
          "/" +
          id +
          "/" +
          JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
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
    openPaymentFile(path) {
      window.open(path, "_blank");
    },

    solicitar(nameproveedor, pagar, id, type) {
      var vm = this;
      if (type == 1) {
        vm.$swal({
          icon: "warning",
          title: "Lo sentimos",
          text: "No puede realizar solicitudes hasta colocar un proveedor real.",
        });
      } else {
        vm.proveedorId = id;
        (vm.selected = []),
          (vm.selectedAccount = []),
          vm
            .$swal({
              title: "¿Desea realizar una solicitud con división de pago?",
              showDenyButton: true,
              showCancelButton: true,
              confirmButtonText: "Si",
              denyButtonText: `No`,
              cancelButtonText: "Cancelar",
              imageUrl: "https://point.qreport.site/files/alto_icono.png",
            })
            .then((result) => {
              /* Read more about isConfirmed, isDenied below */
              if (result.isConfirmed) {
                vm._getConceptos();
              } else if (result.isDenied) {
                vm._getConceptosSimple();
                //vm.selected = vm.$store.state.itemsDataConceptos;
                vm.dialogSolicitud = !vm.dialogSolicitud;
              }
            });

        vm._getAccountsNumber();

        vm.nameproveedorLocal = nameproveedor;
        vm.TotalLocal = pagar;
      }
    },

    async _generateSolicitud() {
      var vm = this;
      vm._calcularTotales();
      vm.$swal({
        icon: "info",
        title: "Generando PDF...",
        text: "Por favor espere",
      });
      var sentido;
      if (vm.$store.state.report_id_sentido == "") {
        sentido = "";
      } else {
        sentido = vm.$store.state.report_id_sentido;
      }

      let pago;
      if (this.total > 0) {
        pago = this.total;
      } else {
        pago = this.TotalLocal;
      }

      let concepto = [];

      if (vm.selected.length > 0) {
        concepto = vm.selected;
      } else {
        concepto = vm.$store.state.itemsDataConceptos;
      }

      var datas = {
        id_house: vm.$route.params.id_house,
        id_proveedor: vm.proveedorId,
        conceptos: concepto,
        monto: pago,
        status: 1,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "setSPaymentPro",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: datas,
      };

      axios(config)
        .then(function (response) {
          var data = {
            nameProveedor: vm.nameproveedorLocal,
            nameConsignatario: vm.$store.state.dataHouse_consigners,
            totalPagar: vm.TotalLocal,
            expediente: vm.$store.state.dataHouse_exp,
            fecha: vm.currentDate(),
            totalProveedores: vm.$store.state.itemsDataTotalesProveedor,
            comentarios: vm.comentarios,
            codigo_pago: vm.codigo_pago,
            codigo_master: vm.codigo_master,
            cuentas: vm.selectedAccount,
            operador: vm.$store.state.dataHouse_operador,
            conceptos: vm.$store.state.itemsDataConceptos,
            selected: vm.selected,
            totalSelected: vm.total,
            number: response.data.data[0].number,
            url_logo: JSON.parse(sessionStorage.getItem("dataUser"))[0].path,
          };
          var config = {
            method: "post",
            url: process.env.VUE_APP_URL_MAIN + "pdfSolicitud",
            headers: {
              "auth-token": sessionStorage.getItem("auth-token"),
              "Content-Type": "application/json",
            },
            data: data,
          };

          axios(config)
            .then(function (response) {
              vm._getTotalesProveedor();
              vm.$swal({
                icon: "success",
                title: "PDF Generado",
                text: "El PDF se descargará automaticamente",
              });
              window.open(
                process.env.VUE_APP_URL_MAIN + response.data.path,
                "_blank"
              );
            })
            .catch(function (error) {
              console.log(error);
            });
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    _calcularTotales() {
      if (this.selected.length > 0) {
        var vm = this;

        vm.total = 0;

        let calculo = 0;

        vm.selected.map((item) => {
          calculo = calculo + parseFloat(item.total_op);

          vm.total = calculo.toFixed(2);
        });
      } else {
        var vm = this;

        vm.total = 0;

        let calculo = 0;

        vm.$store.state.itemsDataConceptos.map((item) => {
          calculo = calculo + parseFloat(item.total_op);

          vm.total = calculo.toFixed(2);
        });
      }
    },

    currentDate() {
      const monthNames = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ];
      const current = new Date();
      const date = `${current.getDate()} de ${
        monthNames[current.getMonth()]
      } del ${current.getFullYear()}`;
      return date;
    },

    _deleteServices(id) {
      var vm = this;
      var data = {
        id: id,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "deleteServices",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios(config)
        .then(function (response) {
          if (response.data.status == 200) {
            vm._validaData();
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    _validaData() {
      var vm = this;
      vm.$store.state.spiner = true;
      if (vm.$route.params.id_house) {
        vm.$store.state.house_Id_get = vm.$route.params.id_house;
        var data = {
          id: vm.$route.params.id_house,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        };
        var config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + "getHouseServices",
          headers: {
            "auth-token": sessionStorage.getItem("auth-token"),
            "Content-Type": "application/json",
          },
          data: data,
        };
        axios(config)
          .then(function (response) {
            vm.$store.state.itemsHouseServices = response.data.data;
          })
          .catch(function (error) {
            console.log(error);
          });
      }
      vm.$store.state.spiner = false;
    },

    async _getConceptosSimple() {
      var vm = this;
      var config = {
        method: "post",
        url:
          process.env.VUE_APP_URL_MAIN +
          "getEgresosDivision/" +
          vm.$route.params.id_orders +
          "/" +
          vm.proveedorId,
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm.$store.state.itemsDataConceptos = response.data.data;
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _getConceptos() {
      var vm = this;
      var config = {
        method: "post",
        url:
          process.env.VUE_APP_URL_MAIN +
          "getEgresosDivision/" +
          vm.$route.params.id_orders +
          "/" +
          vm.proveedorId,
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm.$store.state.itemsDataConceptos = response.data.data;
          vm.dialogSolicitudDivision = !vm.dialogSolicitudDivision;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
  },
  watch: {
    actualizar() {
      this._getTotalesProveedor();
    },
  },
};
</script>

<style lang="scss" scoped>
.listMain {
  padding: 0px;
}

.btn_add {
  cursor: pointer;
}
</style>

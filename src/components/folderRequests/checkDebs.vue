<template>
  <div>
    <v-card elevation="0" class="mx-auto">
      <v-card-subtitle>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Buscar abono"
          single-line
          hide-details
        ></v-text-field>
      </v-card-subtitle>

      <v-data-table
        :headers="headersdebs"
        :items="itemsDebsClient"
        :search="search"
      >
        <template v-slot:[`item.status`]="{ item }">
          <v-chip
            v-if="item.status == 1"
            class="ma-2"
            color="orange"
            text-color="white"
          >
            {{ item.status == 1 ? "Por Confirmar" : "" }}
          </v-chip>
          <v-chip
            v-if="item.status == 2"
            class="ma-2"
            color="green"
            text-color="white"
          >
            {{ item.status == 2 ? "Confirmado" : "" }}
          </v-chip>
        </template>
        <template v-slot:[`item.accion`]="{ item }">
          <v-icon class="mr-2" @click="viewPdf(item.path)"> mdi-eye </v-icon>
        </template>
        <template v-slot:[`item.instructivo`]="{ item }">
          <v-icon
            color="info"
            class="mr-2"
            @click="editControl(item.code_master)"
          >
            mdi-pencil
          </v-icon>
        </template>

        <template v-slot:[`item.accions`]="{ item }">
          <v-icon
            v-if="item.status == 1"
            color="blue-grey darken-2"
            class="mr-2"
            @click="
              processPayment(
                item.id,
                item.path,
                item.nro_master,
                item.monto_letra,
                item.name
              )
            "
          >
            mdi-check-circle
          </v-icon>
          <v-icon
            v-if="item.status == 2 && security == 1"
            color="blue-grey darken-2"
            class="mr-2"
            @click="reversar(item)"
          >
            mdi-undo-variant
          </v-icon>

          <v-icon
            v-if="item.status == 3"
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
            Aprobar Pago por el Monto de
            {{ paymentmonto }} <br />
            {{ nameproveedor }}
          </h3>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row dense>
              <v-col cols="12">
                <iframe
                  width="100%"
                  height="400px"
                  :src="pathRuta"
                  frameborder="0"
                >
                </iframe>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  label="Nro operacion en Cuenta de Banco"
                  required
                  v-model="nro_operacion"
                  :error-messages="errorNroOp"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-checkbox v-model="checkComision" label="Aplica comisión">
                </v-checkbox>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="montocomision"
                  type="number"
                  v-if="checkComision"
                  label="Monto de la comisión"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="12">
                <v-textarea
                  v-model="comentarioadmin"
                  label="Comentario"
                  rows="3"
                >
                </v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="_setCheckDebsClient()"
            >Aprobar Pago</v-btn
          >
          <v-spacer></v-spacer>
          <v-btn outlined color="red" @click="dialogProcess = !dialogProcess"
            >Cerrar</v-btn
          >
        </v-card-actions>
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
  </div>
</template>
<script>
import axios from '@/api/axios-config';
import Swal from "sweetalert2";
import { mapActions } from "vuex";
export default {
  name: "checkDebs",
  data: () => ({
    itemsSPayment: [],
    search: "",

    dialogProcess: false,

    date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .substr(0, 10),
    menu: false,
    modal: false,
    menu2: false,
    security: JSON.parse(sessionStorage.getItem("security")),
    checkComision: false,
    montocomision: "",
    comentarioadmin: "",

    payfile: "",
    pathRuta: "",
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

    itemsDebsClient: [],

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
    errorNroOp: "",
    nro_operacion: "",
    headersdebs: [
      {
        text: "Documento",
        align: "start",
        sortable: false,
        value: "name",
      },
      {
        text: "Expediente",
        value: "nro_master",
      },
      {
        text: "Nro Operación",
        value: "nro_operacion",
      },

      {
        text: "Cliente",
        value: "nameconsigner",
      },
      {
        text: "Fecha",
        value: "date",
      },
      {
        text: "Monto Factura Cliente (USD)",
        value: "monto_letra_pic",
      },
      {
        text: "Tipo de Cambio",
        value: "tipocambio",
      },
      {
        text: "Monto ingresado al Banco",
        value: "monto_letra",
      },

      {
        text: "Monto a pagar a proveedores",
        value: "monto_pagar_pro",
      },
      // {
      //   text: "total cobrado al cliente",
      //   value: "monto_cobrado",
      // },
      {
        text: "Comentario del solicitante",
        value: "comentario_usuario",
      },
      {
        text: "Status",
        value: "status",
      },

      {
        text: "Ver",
        value: "accion",
      },
      {
        text: "Instructivo",
        value: "instructivo",
      },

      {
        text: "Acciones",
        value: "accions",
      },
    ],

    headersPdf: [
      {
        text: "Nombre",
        align: "start",
        sortable: false,
        value: "path",
      },
      {
        text: "Expediente",
        value: "nro_master",
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
        text: "Ver Facturas",
        value: "invoice",
      },
      {
        text: "Ver Solicitud",
        value: "accion",
      },

      {
        text: "Status",
        value: "status",
      },
      {
        text: "Adjuntar",
        value: "accions",
      },
    ],
    dataList: false,
  }),
  async mounted() {
    this.$store.state.spiner = true;
    await this._getDebsClient();
    await this._getBanksList();
    await this._getCoinsList();
    this.$store.state.spiner = false;
  },
  methods: {
    ...mapActions(["_getBanksList", "_getCoinsList"]),
    getDebs() {
      this.$store.state.spiner = true;
      this._getDebsClient();
      this.$store.state.spiner = false;
    },
    editControl(nro_master) {
      this.$router.push({
        name: "editControlGasto",
        params: {
          code_master: nro_master,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        },
      });
      // window.open(
      //   "/home/folderBilling/editControlGastos/view/" + nro_master,
      //   "Instructivo",
      //   "width=1593,height=1293",
      //   "menubar=no",
      //   "location=no",
      //   "resizable=no"
      // );
    },
    processPayment(id, path, master, monto, namelong) {
      this.sPaymentId = id;
      this.paymentname = path;
      this.pathRuta = path;
      this.paymentMaster = master;
      this.paymentmonto = monto;
      this.nameproveedor = namelong;
      this._getRequestPaymentConceptos(this.sPaymentId);
      this.dialogProcess = true;
    },
    openDoc(path) {
      window.open(path, "_blank");
    },
    async reversar(item) {
      Swal.fire({
        title: "Aviso",
        text: "¿Esta seguro que quiere reversar la confirmación de esta cuenta por cobrar?",
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
        url: process.env.VUE_APP_URL_MAIN + "reversar_debscliente",

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

    async _getDebsClient() {
      var vm = this;
      let data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getDebsClientList",

        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.dataList = true;
          vm.itemsDebsClient = response.data.data;
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
    cleandData() {
      this.date = "";
      this.payoperacion = "";
      this.paybanco = "";
      this.paymoneda = "";
      this.paymonto = "";
      this.payPath = "";
      this.montocomision = "";
      this.checkComision = "";
      this.comentarioadmin = "";
    },
    async _setCheckDebsClient() {
      var vm = this;
      if (vm.nro_operacion) {
        vm.$swal({
          icon: "info",
          title: "Aprobando el pago...",
          text: "Por favor espere",
        });
        var data = {
          comentario_admin:
            !vm.comentarioadmin || vm.comentarioadmin == ""
              ? null
              : vm.comentarioadmin,
          checkComision:
            !vm.checkComision || vm.checkComision == ""
              ? null
              : vm.checkComision,
          comision:
            !vm.montocomision || vm.montocomision == ""
              ? null
              : vm.montocomision,
          status: 2,
          nro_operacion: vm.nro_operacion,
          id: vm.sPaymentId,
        };
        var config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + "setCheckDebsClient/",

          headers: {
            "auth-token": sessionStorage.getItem("auth-token"),
            "Content-Type": "application/json",
          },
          data: data,
        };
        await axios(config)
          .then(function (response) {
            vm._getDebsClient();
            //vm.itemsSPayment = response.data.data;
            vm.$swal({
              icon: "success",
              title: "Pago Aprobado",
              text: "El pago ha sido Aprobado correctamente",
            });

            vm.cleandData();
            vm.dialogProcess = false;
          })
          .catch(function (error) {
            console.log(error);
          });
      } else {
        this.errorNroOp = "Dato Requerido.";
      }
    },
    async _getRequestPayment() {
      var vm = this;
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getRequestPayment",
        data: {
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
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
      window.open(pdf, "_blank");
    },
  },
};
</script>

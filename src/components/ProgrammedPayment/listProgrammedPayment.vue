<template>
  <div class="">
    <v-data-table
      :headers="headers"
      :items="$store.state.programaciones.listado"
      v-model:expanded="expanded"
      item-value="id"
      show-expand
      expand-on-click
      class="mx-4 ext-uppercase"
      :custom-filter="filterOnlyCapsText"
      fixed-header
    >
      <template v-slot:[`item.total_dolar_total`]="{ item }">
        $ {{ item.total_dolar }}
      </template>
      <template v-slot:[`item.total_soles_total`]="{ item }">
        {{ monExt }} {{ item.total_soles }}
      </template>
      <template v-slot:expanded-row="{ item }">
        <tr>
          <td colspan="11">
            <v-table style="width: 100%">
              <thead>
                <tr style="background: #fff1cf">
                  <th>Accion</th>
                  <th>Proveedor</th>
                  <th>Monto</th>
                  <th>Deuda Actual</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="child of item.details" :key="child.id">
                  <td>
                    <v-btn variant="text"
                      icon
                      color="primary"
                      @click="payment(child, item.id)"
                      v-if="child.status == false"
                    >
                      <v-icon>mdi-hand-coin</v-icon>
                    </v-btn>
                    <v-btn variant="text"
                      icon
                      color="red"
                      @click="
                        eliminar(item, child.id_proveedor, child.id_details)
                      "
                      v-if="child.status == false"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </td>
                  <td>{{ child.proveedor }}</td>

                  <td>{{ child.symbol }} {{ child.monto_original }}</td>
                  <td>{{ child.symbol }} {{ child.monto }}</td>

                  <td>
                    <v-chip color="orange" variant="outlined" v-if="child.status == false">
                      Por Pagar
                    </v-chip>
                    <v-chip color="green" variant="outlined" v-if="child.status == true">
                      Pagado
                    </v-chip>
                  </td>
                </tr>
              </tbody></v-table
            >
          </td>
        </tr>
      </template>
    </v-data-table>

    <v-dialog
      v-model="dialog"
      fullscreen
      persistent
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap" primary-title>
          PROVEEDOR: {{ nameproveedor }}
          <v-spacer></v-spacer>
          <v-btn variant="text" icon color="default" @click="dialog = !dialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="3">
              <v-text-field
                style="font-size: 20pt; color: green"
                label="Monto en que va a salir del banco"
                v-model="montoMonExt"
                readonly
                :prefix="acronym"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-tabs
            color="#A43542"
            slider-color="primary"
            fixed-tabs
            v-model="tab"
          >
            <v-tab value="ref1">STEP 1</v-tab>
            <v-tab value="ref2" v-if="selected.length > 0">STEP 2</v-tab>
          </v-tabs>
          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="ref1">
              <v-row>
                <v-col cols="3">
                  <v-text-field
                    label="Buscar..."
                    v-model="search"
                  ></v-text-field>
                </v-col>
                <v-col cols="3">
                  <v-btn
                    v-if="selected.length > 0"
                    color="green-darken-4"
                    @click="continuar()"
                    >Continuar</v-btn
                  >
                </v-col>
              </v-row>
              <v-data-table
                :headers="headersProgXProveedor"
                :items="$store.state.programaciones.listProgramacionxProveedor"
                class="elevation-1"
                show-select
                item-value="id"
                return-object
                v-model="selected"
                :search="search"
              >
                <template v-slot:[`item.item_moneda`]="{ item }">
                  <v-autocomplete
                    :items="$store.state.itemsCoinsList"
                    v-model="item.id_coins"
                    item-title="acronym"
                    item-value="id"
                    label="Moneda"
                    v-on:blur="calcularTotales()"
                    :disabled="
                      selected.filter((v) => v.id == item.id).length == 0
                    "
                  ></v-autocomplete>
                </template>
                <!--  -->
                <template v-slot:[`item.tipo_cambio`]="{ item }">
                  <v-text-field
                    v-model="item.tipocambio"
                    type="number"
                    step="0.01"
                    :disabled="
                      selected.filter((v) => v.id == item.id).length == 0
                    "
                    v-on:blur="calcularTotales()"
                  ></v-text-field>
                </template>
                <!--  -->
                <template v-slot:[`item.monto_mon_extranjera`]="{ item }">
                  {{ item.acronym }} {{ item.monto_mon_ex }}
                </template>
                <template v-slot:[`item.action`]="{ item }">
                  <v-btn variant="text" icon color="red" @click="eliminarDetalle(item)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>

                <!--  -->
                <template v-slot:[`item.monto_pagar`]="{ item }">
                  <v-text-field
                    v-model="item.monto_mon_ext"
                    type="number"
                    :disabled="
                      selected.filter((v) => v.id == item.id).length == 0
                    "
                    :prefix="acronym"
                    v-on:blur="calcularTotalesInput()"
                    :error-messages="item.errorEx"
                  ></v-text-field>
                </template>
              </v-data-table>
            </v-tabs-window-item>
            <v-tabs-window-item value="ref2">
              <v-form ref="frmPagoStep2">
                <v-row class="mt-5">
                  <v-col cols="3">
                    <v-text-field
                      v-model="nro_operacion"
                      label="N° de Operación"
                      :rules="[(v) => !!v || 'Datos Requerido']"
                      v-on:blur="ValidaNroOp()"
                      :error-messages="msgNroOperacion"
                      id="nro_operacion"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="3" md="3">
                    <v-text-field
                      type="date"
                      v-model="date"
                      label="Fecha"
                      :rules="[(v) => !!v || 'Datos Requerido']"
                    ></v-text-field>
                  </v-col>
                  <v-col md="6" cols="6">
                    <v-file-input
                      label="Cargar Archivo"
                      v-model="payfile"
                      @update:model-value="uploadFile()"
                      :messages="msgfile"
                      :class="{ 'text-success': !!msgfile }"
                      :error-messages="errfile"
                      :rules="[(v) => !!v || 'Datos Requerido']"
                      :loading="loadingFile"
                    >
                    </v-file-input>
                  </v-col>

                  <v-col md="4" cols="4">
                    <v-autocomplete
                      :items="cuentas.filter((v) => v.symbol == acronym)"
                      item-title="label"
                      item-value="id"
                      label="CUENTA BANCARIA"
                      v-model="id_cuenta"
                      :rules="[(v) => !!v || 'Datos Requerido']"
                      return-object
                    ></v-autocomplete>
                  </v-col>
                  <v-col md="4" cols="4">
                    <v-text-field
                      readonly
                      v-model="id_cuenta.banco"
                      label="Banco:"
                    ></v-text-field>
                  </v-col>
                  <v-col md="4" cols="4">
                    <v-text-field
                      readonly
                      v-model="id_cuenta.moneda"
                      label="Moneda:"
                    ></v-text-field>
                  </v-col>
                  <v-col md="4" cols="4"
                    ><v-text-field
                      readonly
                      v-model="id_cuenta.cuenta"
                      label="N° Cuenta:"
                    ></v-text-field
                  ></v-col>
                  <v-col md="4" cols="4"
                    ><v-text-field
                      readonly
                      v-model="id_cuenta.cci"
                      label="CCI:"
                    ></v-text-field></v-col
                  ><v-col md="4" cols="4"
                    ><v-text-field
                      v-model="comentarios"
                      label="Comentarios"
                      placeholder="Comentarios......"
                    ></v-text-field
                  ></v-col>
                  <v-col md="12" cols="12">
                    <div class="text-right">
                      <v-btn
                        color="success"
                        :loading="loadingRegistro"
                        variant="text"
                        @click="registrarPago()"
                      >
                        PROCESAR PAGO
                      </v-btn>
                    </div>
                  </v-col>
                </v-row>
              </v-form>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { defineAsyncComponent } from "vue";
import axios from '@/api/http';
import moment from "moment";
import { mapActions, mapState } from "vuex";

import Swal from "sweetalert2";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useFilesStore } from "@/stores/files";
import { useBancosStore } from "@/stores/bancos";
export default {
  name: "listProgrammedPaymentComponent",
  emits: ["cerrar"],
  components: {
    ModalPagoControlGastoComponent: defineAsyncComponent(() =>
      import("../../components/modal/modalPagoControlGasto.vue")),
  },
  data: () => ({
    monExt: "",
    msgNroOperacion: "",
    id: null,
    id_proveedor: null,
    comentarios: "",
    id_coins: 1,
    tipocambio: 1,
    acronym: "USD",
    msgfile: "",
    errfile: "",
    id: "",
    nro_operacion: "",
    search: "",
    headers: [
      {
        title: "Correlativo",
        key: "correlativo",
      },
      {
        title: "Fecha Programada",
        key: "fecha",
      },
      {
        title: "Total Pagar Dolares",
        key: "total_dolar_total",
      },
      {
        title: "Total Pagar Soles",
        key: "total_soles_total",
      },
    ],
    listado: [],
    selected: [],
    dialogPagoControlGasto: false,
    dialogProcess: false,
    payfile: null,
    payoperacion: "",
    paybanco: "",
    paymoneda: "",
    paymonto: "",

    itemsSPaymentConceptos: [],
    dialogPath: false,
    pathfile: "",
    sPaymentId: "",
    paymentname: "",
    paymentMaster: "",
    paymentmonto: "",
    payPath: "",
    nameproveedor: "",
    id_proveedor: "",
    id_orders: "",
    dialogListInvoince: false,
    itemsListInvoice: [],
    date: moment(new Date()).format("YYYY-MM-DD"),
    pathfileAll: "",
    boolFile: false,
    fecha: moment(new Date()).add(7, "days").format("YYYY-MM-DD"),
    menu: false,
    cuentas: [],
    itemsProveedores: [],
    tab: null,
    step2: true,
    total: 0,
    id_proveedor: "",
    id_cuenta: "",
    dialgoCXP: false,
    search: "",
    montoDolar: 0,
    montoMonExt: 0,
    headersCXP: [
      {
        text: "Fecha",
        value: "fecha",
      },

      {
        text: "Expediente",
        value: "codigo_house",
      },
      {
        text: "Factura",
        value: "nro_factura",
      },
      {
        text: "Cliente",
        value: "tradename_cliente",
      },
      {
        text: "Cliente Pagó",
        value: "statuspago",
      },
      {
        text: "Monto",
        value: "monto_pagar",
      },

      {
        text: "Monto Deuda",
        value: "monto_deuda",
      },
      {
        text: "Moneda Pagar",
        value: "item_moneda",
      },
      {
        text: "Tipo Cambio",
        value: "tipo_cambio",
      },
      {
        text: "Pago Total",
        value: "check_total",
      },
      {
        text: "Pago Parcial",
        value: "pago",
      },
      {
        text: "Pagar",
        value: "pagarflag",
      },
    ],
    headersProgXProveedor: [
      { title: "Expediente", key: "nro_master" },
      // { text: "Master", value: "code_control" },
      { title: "Factura/ Proforma", key: "expedientes" },
      { title: "Procedencia", key: "procedencia" },
      { title: "Monto (USD)", key: "monto" },
      { title: "Monto Factura", key: "monto_mon_extranjera" },
      {
        title: "Tipo Cambio",
        key: "tipo_cambio",
      },
      {
        title: "Moneda Pagar",
        key: "item_moneda",
      },
      { title: "Monto Pagar", key: "monto_pagar" },
      { title: "Acción", key: "action" },
    ],
    expanded: [],
    expand: [],
    idDetails: "",
    dialog: false,
    nameproveedor: "",
    date: "",
    loadingFile: false,
    loadingRegistro: false,
    errorTipCambio: "",
    symbol: "USD",
  }),
  async mounted() {
    this.monExt = this.moneda = JSON.parse(
      sessionStorage.getItem("dataBranch"),
    )[0].moneda[0].symbol;
    this.$store.state.spiner = true;
    await this.ListProgrammedPayment();
    await this.cargarProveedores();
    await this.getListBanksDetailsCargar();
    await this._getCoinsList();
    await this.limpiarDatos();
    this.$store.state.spiner = false;
  },
  methods: {
    ...mapActions([
      "_getListaPagosXProveedorCxP",
      "getListProgramacion",
      "_getCoinsList",
      "setPagoProgramado",
      "ListProgrammedPayment",
      "eliminarProgramacion",
      "eliminarProgramacionDetalle",
      "cargarProveedores",
    ]),
    ...mapPiniaActions(useBancosStore, ["getValidaNroOp"]),
    ...mapPiniaActions(useFilesStore, ["_uploadFile"]),
    async ValidaNroOp() {
      this.msgNroOperacion = "";
      this.$store.state.spiner = true;
      await this.getValidaNroOp(this.nro_operacion);
      if (!!this.bancosStore.validacionBanco.estadoflag) {
        this.msgNroOperacion = this.bancosStore.validacionBanco.mensaje;
        document.getElementById("nro_operacion").focus();
      } else {
        this.msgNroOperacion = "";
      }

      this.$store.state.spiner = false;
    },
    moverSeleccionadoAlInicio() {
      const listaPagos = this.$store.state.listPagosXProveedorCxP;

      const seleccionadosIds = new Set(this.selected.map((item) => item.id));

      listaPagos.sort((a, b) => {
        const aSeleccionado = seleccionadosIds.has(a.id);
        const bSeleccionado = seleccionadosIds.has(b.id);

        if (aSeleccionado && !bSeleccionado) return -1;
        if (!aSeleccionado && bSeleccionado) return 1;
        return 0;
      });
    },
    getAcronym() {
      this.acronym = this.$store.state.itemsCoinsList.filter(
        (v) => v.id == this.id_coins,
      )[0].symbol;
      if (this.acronym != "USD" && this.tipocambio == 1) {
        this.errorTipCambio = "Seleccione un tipo de cambio";
      }
    },
    limpiarDatos() {
      this.payfile = null;
      this.payPath = "";
      this.id_proveedor = "";
      this.boolFile = false;
      this.tab = "ref1";
      this.step2 = true;
      this.total = 0;
      this.$store.state.listPagosXProveedorCxP = [];
    },

    async obtenerListado() {
      await this._getListaPagosXProveedorCxP(this.id_proveedor);
    },

    validarSeleccionado() {
      this.fecha = this.selected[0].fecha;
    },

    cerrarModal() {
      this.$emit("cerrar", false);
    },

    async payment(item, id) {
      this.tab = "ref1";
      this.payfile = [];
      this.comentarios = null;
      this.id = id;
      this.id_proveedor = item.id_proveedor;
      this.id_coins = item.id_coins;
      this.id_coins = 1;
      // this.tipocambio = 1;
      this.selected = [];
      this.date = null;
      this.nro_operacion = null;
      this.id_cuenta = "";
      this.nameproveedor = item.proveedor;
      this.filesStore.payPath = "";
      await this.getListProgramacion({
        id_proveedor: item.id_proveedor,
        id: id,
        id_coins: item.id_coins,
      });
      this.dialog = true;
    },
    calcularTotales() {
      let monex = 0;
      if (this.selected.length > 0) {
        this.selected.forEach((element) => {
          this.tipocambio = element.tipocambio;
          this.id_coins = element.id_coins;
          element.monto_mon_ext = parseFloat(
            parseFloat(element.monto) * parseFloat(element.tipocambio),
          ).toFixed(2);

          monex = parseFloat(monex) + parseFloat(element.monto_mon_ext);
        });
      }
      this.acronym = this.$store.state.itemsCoinsList.filter(
        (v) => v.id == this.id_coins,
      )[0].symbol;
      this.montoMonExt = parseFloat(monex).toFixed(2);
    },
    calcularTotalesInput() {
      let monex = 0;
      this.selected.forEach((element) => {
        element.errorEx = "";
        if (
          parseFloat(element.monto_mon_ext) >
          parseFloat(parseFloat(element.monto) * parseFloat(element.tipocambio))
        ) {
          element.errorEx =
            "El monto no puede ser mayor que el monto como deuda";
        } else {
          monex = parseFloat(monex) + parseFloat(element.monto_mon_ext);
        }
      });
      this.montoMonExt = parseFloat(monex).toFixed(2);
    },
    processPayment(id, path, master, monto, proveedor) {
      this.sPaymentId = id;
      this.paymentname = path;
      this.paymentMaster = master;
      this.paymentmonto = monto;
      this.nameproveedor = proveedor;
      this.payfile = "";
      this._getRequestPaymentConceptos(this.sPaymentId);
      this.dialogProcess = true;
    },

    async _getRequestPaymentConceptos(id) {
      var vm = this;
      var config = {
        method: "post",
        url: import.meta.env.VITE_URL_MAIN + "getRequestPaymentConceptos/" + id,

        headers: {
         
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm.itemsSPaymentConceptos = response.data.data;
        })
        .catch(function (error) {
          console.error(error);
        });
    },
    async uploadFile() {
      this.msgfile = "";
      this.errfile = "";
      if (this.payfile) {
        this.loadingFile = true;
        await this._uploadFile(this.payfile);
        this.loadingFile = false;
        this.filesStore.payPath
          ? (this.msgfile = "Archivo cargado")
          : (this.errfile = "Comuniquese con el admistrador");
      } else {
        this.errfile = "Dato Requerido";
      }
    },
    async registrarPago() {
      if ((await this.$refs.frmPagoStep2.validate()).valid) {
        this.loadingRegistro = true;
        let data = {
          id_coins: this.id_coins,
          tipocambio: this.id_coins == 1 ? 1 : this.tipocambio,
          details: this.selected,
          fecha: this.date,
          nro_operacion: this.nro_operacion,
          id_cuentas: this.id_cuenta.id,
          id_path: this.filesStore.payPath,
          id_proveedor: this.id_proveedor,
        };
        await this.setPagoProgramado(data);
        this.dialog = false;
        this.loadingRegistro = false;
      }
    },

    async getListBanksDetailsCargar() {
      let vm = this;
      var config = {
        method: "get",
        url: import.meta.env.VITE_URL_MAIN + "getListBanksDetailsCargar",
        params: {
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        },
        headers: {
         
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm.cuentas = response.data.data;
        })
        .catch(function (error) {
          console.error(error);
        });
    },
    validarMonto(details) {
      if (details.max_pagar > details.monto_deuda) {
        document.getElementById(`pago${details.id}`).focus();
      } else {
        this.calcularTotal();
      }
    },
    calcularTotal() {
      let sum = 0;
      this.listPagosXProveedorCxP.map((item) => {
        if (item.pagar) {
          if (item.cktotal) {
            sum += parseFloat(item.monto_deuda);
            item.max_pagar = item.monto_deuda;
          } else {
            sum += parseFloat(item.max_pagar);
          }
        }
      });
      this.total = parseFloat(sum).toFixed(4);
    },
    calcularTotalPagado() {
      let sum = 0;
      this.listPagosXProveedorCxP.map((item) => {
        sum += parseFloat(item.monto_pagar);
      });
      this.totalPagado = parseFloat(sum).toFixed(4);
    },
    setearMonto(details) {
      if (details.pagar) {
        this.listPagosXProveedorCxP.filter(
          (v) => v.id == details.id,
        )[0].cktotal = true;
      }
    },

    validar(registro = false) {
      let validacion = true;
      let msg = "";
      if (!this.payPath && registro) {
        validacion = false;
        msg += "Por favor, seleccione un documento para soporte de pago. ";
      }
      if (!this.id_cuenta && registro) {
        validacion = false;
        msg += "Por favor, seleccione una cuenta. ";
      }

      if (!this.listPagosXProveedorCxP.filter((v) => v.pagar).length > 0) {
        validacion = false;
        msg += "Seleccione al menos una cuenta a pagar. ";
      }

      if (
        this.listPagosXProveedorCxP.filter((v) => v.monto_deuda < v.max_pagar)
          .length > 0
      ) {
        validacion = false;
        msg += "No puede realizar un pago mayor a la deuda. ";
      }
      if (!validacion) {
        this.$swal({
          icon: "error",
          title: "Lo sentimos",
          text: msg,
        });
      }

      return validacion;
    },
    async _putPayForProveedor() {
      if (this.validar(true)) {
        let vm = this;
        var data = {
          id_proveedor: vm.id_proveedor.id,
          id_path: vm.payPath,
          details: vm.listPagosXProveedorCxP.filter((v) => v.pagar),
          id_cuenta: vm.id_cuenta.id,
        };
        var config = {
          method: "post",
          url: import.meta.env.VITE_URL_MAIN + "setPayForProveedor",

          headers: {
           
            "Content-Type": "application/json",
          },
          data: data,
        };
        await axios(config)
          .then(function (response) {
            if (response.data.statusBol == true) {
              vm.$swal({
                icon: "success",
                title: "Aviso",
                text: response.data.data.msg,
              });
              vm.ActualizarPagoProgramado();
            }
          })
          .catch(function (error) {
            console.error(error);
          });
      }
    },
    continuar() {
      this.step2 = false;
      this.tab = "ref2";
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
        id_proveedor: vm.id_proveedor,
        id_orders: vm.id_orders,
      };
      var config = {
        method: "post",
        url: import.meta.env.VITE_URL_MAIN + "setSPaymentFile/",

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

          vm.ActualizarPagoProgramado();
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
    },
    async obtenerDatos() {
      if (this.tipo == "ver") {
        let vm = this;
        let id = vm.$route.params.id;

        var config = {
          method: "get",
          url:
            import.meta.env.VITE_URL_MAIN + `getVerPagosPorProveedor?id=` + id,

          headers: {
           
            "Content-Type": "application/json",
          },
        };
        await axios(config)
          .then(function (response) {
            let data = response.data.data[0];
            vm.step2 = false;
            vm.id_proveedor = data.id_proveedor;
            vm.$store.state.listPagosXProveedorCxP = data.details;
            vm.id_cuenta = data.id_bank;
            vm.name_path = data.documento;
            vm.url_documento = data.link_documento;
            setTimeout(() => {
              vm.calcularTotalPagado();
            }, 200);
          })
          .catch(function (error) {
            console.error(error);
          });
      }
    },

    async ActualizarPagoProgramado() {
      var vm = this;
      var config = {
        method: "put",
        url:
          import.meta.env.VITE_URL_MAIN +
          `updateProgrammedPayment/${vm.idDetails}`,
        headers: {
         
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm.dialgoCXP = false;
          vm.dialogProcess = false;
          vm.ListProgrammedPayment();
        })
        .catch(function (error) {
          console.error(error);
        });
    },
    async eliminar(item, id_proveedor, id_details) {
      Swal.fire({
        icon: "question",
        text: "¿Está seguro que de desea eliminar esta programación?",
        showDenyButton: "Cancelar",
        denyButtonText: "Cancelar",
        confirmButtonText: "Eliminar",
        confirmButtonColor: "green",
      }).then((result) => {
        if (result.isConfirmed) {
          this.eliminarProgramacion({
            id: parseInt(item.correlativo),
            id_proveedor: id_proveedor,
            id_details: id_details,
          });
        }
      });
    },
    filterOnlyCapsText(value, search) {
      let text = search ? search.toLocaleUpperCase() : null;
      return (
        value != null &&
        search != null &&
        typeof value === "string" &&
        value.toString().toLocaleUpperCase().indexOf(text) !== -1
      );
    },
    verDocumento(url) {
      window.open(url, "_blank");
    },
    async eliminarDetalle(item) {
      await Swal.fire({
        icon: "question",
        html: `Está seguro que desea eliminar de la programación el registro correspondiente al exp <b>${item.nro_master}</b>`,
        confirmButtonText: "Eliminar",
        denyButtonText: "Cancelar",
        showDenyButton: "Cancelar",
      }).then(async (result) => {
        if (result.isConfirmed) {
          this.$store.state.spiner = true;
          await this.eliminarProgramacionDetalle({ id: item.id });
          this.id_coins = 1;
          this.tipocambio = 1;
          this.selected = [];
          this.date = null;
          this.nro_operacion = null;
          this.id_cuenta = "";
          this.nameproveedor = item.proveedor;
          this.filesStore.payPath = "";
          await this.getListProgramacion({
            id_proveedor: this.id_proveedor,
            id: this.id,
          });
          this.$store.state.spiner = false;
        }
      });
    },
  },
  computed: {
    ...mapStores(useBancosStore, useFilesStore),
    ...mapState(["itemsProveedorList", "listPagosXProveedorCxP", "actualizar"]),
  },
  watch: {
    selected(newVal, oldVal) {
      this.calcularTotales();
      if (newVal.length > oldVal.length) {
        this.$nextTick(() => {
          this.moverSeleccionadoAlInicio();
        });
      }
    },
  },
};
</script>

<style></style>

<!-- ----- pid_programend -->

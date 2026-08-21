<template>
  <div>
    <v-card elevation="0">
      <v-card-title v-if="tipo == 'nuevo'">
        CARGAR UNA CUENTA POR COBRAR
      </v-card-title>
      <v-card-title v-if="tipo == 'ver'">
        VER FACTURA TIPO
        {{ row == 1 ? "ADMNINISTRATIVA" : "OPERATIVA" }}
      </v-card-title>
      <v-card-title v-if="tipo == 'editar'">
        EDITAR FACTURA TIPO
        {{ row == 1 ? "ADMNINISTRATIVA" : "OPERATIVA" }}</v-card-title
      >
      <v-card-text>
        <v-radio-group v-model="radio" row v-if="tipo == 'nuevo'">
          <v-radio value="1" label="Administrativa"></v-radio>
          <v-radio value="2" label="Operativa"></v-radio>
        </v-radio-group>
        <v-row dense>
          <v-col cols="12" md="6" v-if="radio == 2">
            <v-autocomplete
              :items="$store.state.houses.listHouse"
              item-text="description"
              item-value="id"
              label="Expediente"
              v-model="id_expediente"
              :disabled="radio == ''"
              @change="_getProformace()"
            >
            </v-autocomplete>
          </v-col>
          <v-col cols="12" md="6" v-if="radio == 1">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-autocomplete
                  :items="$store.state.month"
                  item-text="description"
                  item-value="id"
                  label="Mes del Ingreso"
                  v-model="id_month"
                  :disabled="radio == ''"
                >
                </v-autocomplete>
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  :items="$store.state.year"
                  item-text="description"
                  item-value="id"
                  label="Año del Ingreso"
                  v-model="id_year"
                  :disabled="radio == ''"
                >
                </v-autocomplete>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12" md="6">
            <v-autocomplete
              label="Tipo de Ingreso"
              :items="
                $store.state.balances.tipoingreso.filter((v) => v.id != 0)
              "
              v-model="tipoingreso"
              auto-select-first
              clearable
              item-text="description"
              item-value="id"
              :disabled="radio == ''"
              :rules="[(v) => !!v || 'Datos Requerido']"
            ></v-autocomplete>
          </v-col>
          <v-col cols="12" md="6">
            <v-autocomplete
              label="Subtipo de Ingreso"
              :items="tiposubingresoFilter.filter((v) => v.id != 0)"
              v-model="id_tipoingreso"
              auto-select-first
              clearable
              item-text="description"
              item-value="id"
              :disabled="!tipoingreso"
              :rules="[(v) => !!v || 'Datos Requerido']"
            ></v-autocomplete>
          </v-col>

          <v-col cols="12" md="6">
            <v-autocomplete
              :items="$store.state.performances"
              item-text="description"
              item-value="id"
              label="Proformace"
              v-model="id_proformace"
              :disabled="radio == ''"
              @change="validacionesRequeridas()"
              return-object
            >
            </v-autocomplete>
          </v-col>
          <v-col cols="12" md="6">
            <v-autocomplete
              :items="$store.state.clientes"
              item-text="namelong"
              item-value="id"
              label="Cliente"
              v-model="id_cliente"
              :disabled="radio == ''"
            >
              <v-icon
                @click.native="_callModalEntitie()"
                slot="append"
                class="btn__add"
                color="primary"
              >
                mdi-plus
              </v-icon>
            </v-autocomplete>
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              type="date"
              :disabled="radio == ''"
              label="Fecha Emisión de la Factura"
              v-model="date"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="nro_factura"
              :disabled="radio == ''"
              label="Nro. de Factura"
              :required="facturaFlag"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="nro_serie"
              :disabled="radio == ''"
              label="Nro. de Serie"
              :required="serieFlag"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-autocomplete
              :disabled="radio == ''"
              :items="$store.state.itemsCoinsList"
              v-model="id_coins"
              item-text="acronym"
              item-value="id"
              label="Moneda"
              return-object
              @change="obtenerPrefixCoins()"
            ></v-autocomplete>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              type="number"
              label="Tipo de Cambio"
              v-model="tipocambio"
              :disabled="radio == ''"
              @input.native="cambiarTipodeCambio()"
              v-if="id_coins && symbol != 'USD'"
            ></v-text-field>
          </v-col>
          <!-- SECCIÓN CONCEPTOS DE COBRO -->
          <v-col cols="12" class="mt-4">
            <v-card
              outlined
              color="#f2f8fd"
              class="pa-4 rounded-lg"
              style="border: 1.5px solid #a8d5e5 !important"
            >
              <!-- Encabezado con Icono -->
              <div class="d-flex align-center mb-2">
                <v-avatar color="white" size="36" class="mr-3 elevation-1">
                  <v-icon color="#009688">mdi-file-document-outline</v-icon>
                </v-avatar>
                <span
                  class="text-subtitle-1 font-weight-bold"
                  style="letter-spacing: 0.5px"
                >
                  CONCEPTOS DE COBRO
                </span>
              </div>

              <!-- Alerta / Mensaje Informativo -->
              <div class="d-flex align-center mb-4 pl-1">
                <v-icon color="orange darken-2" small class="mr-1"
                  >mdi-alert-circle-outline</v-icon
                >
                <span
                  class="caption text-uppercase font-weight-bold orange--text text--darken-3"
                >
                  OBLIGATORIO:
                </span>
                <span class="caption grey--text text--darken-2 ml-1">
                  Añade al menos un concepto para continuar.
                </span>
              </div>

              <!-- Botón Añadir Concepto -->
              <v-btn
                block
                color="#009688"
                dark
                x-large
                elevation="0"
                class="text-uppercase font-weight-bold my-2"
                @click="abrirDialogNuevoProducto()"
              >
                <v-icon left>mdi-plus</v-icon>
                Añadir Concepto de Cobro
              </v-btn>

              <!-- Tabla de Conceptos (Muestra si existen registros) -->
              <v-simple-table
                dense
                v-if="itemsproductos.filter((v) => v.status == 1).length > 0"
                class="mt-4 white rounded"
              >
                <thead>
                  <tr>
                    <th v-if="tipo != 'ver'">Acciones</th>
                    <th>Producto / Concepto</th>
                    <th style="background: #adcaf5">Monto</th>
                    <th style="background: #adcaf5">
                      {{ $store.state.enterprises.impuesto.nombre_impuesto }}
                    </th>
                    <th style="background: #adcaf5">Total</th>
                    <th v-if="mostrarColumna()" style="background: #c7f7d7">
                      Monto (USD)
                    </th>
                    <th v-if="mostrarColumna()" style="background: #c7f7d7">
                      {{
                        $store.state.enterprises.impuesto.nombre_impuesto
                      }}(USD)
                    </th>
                    <th v-if="mostrarColumna()" style="background: #c7f7d7">
                      Total (USD)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(productos, index) in itemsproductos.filter(
                      (v) => v.status == 1,
                    )"
                    :key="index"
                  >
                    <td v-if="tipo != 'ver'">
                      <v-btn
                        icon
                        color="red"
                        x-small
                        @click="eliminar(productos)"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </td>
                    <td>{{ productos.concepto }}</td>
                    <td>
                      <span v-if="tipo == 'ver'">{{ productos.monto }}</span>
                      <v-text-field
                        v-else
                        type="number"
                        v-model="productos.monto"
                        step="0.01"
                        @input="recalcularMonto(productos, index)"
                        style="max-width: 150px"
                        outlined
                        dense
                        hide-details
                        :prefix="symbol"
                      ></v-text-field>
                    </td>
                    <td v-if="productos.id != null">{{ productos.igv }}</td>
                    <td v-else>{{ symbol }} {{ productos.igv }}</td>
                    <td>
                      {{ symbol }} {{ parseFloat(productos.total).toFixed(4) }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD {{ productos.montodolar }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD {{ productos.igvdolar }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD {{ parseFloat(productos.totaldolar).toFixed(2) }}
                    </td>
                  </tr>
                  <!-- Fila de Totales -->
                  <tr class="font-weight-bold">
                    <td v-if="tipo != 'ver'"></td>
                    <td>Total:</td>
                    <td>
                      {{ symbol }}
                      {{
                        parseFloat(
                          itemsproductos
                            .filter((v) => v.status == 1)
                            .reduce(
                              (sum, producto) =>
                                sum + parseFloat(producto.monto || 0),
                              0,
                            ),
                        ).toFixed(2)
                      }}
                    </td>
                    <td>
                      {{ symbol }}
                      {{
                        parseFloat(
                          itemsproductos
                            .filter((v) => v.status == 1)
                            .reduce(
                              (sum, producto) =>
                                sum + parseFloat(producto.igv || 0),
                              0,
                            ),
                        ).toFixed(2)
                      }}
                    </td>
                    <td>
                      {{ symbol }}
                      {{
                        parseFloat(
                          itemsproductos
                            .filter((v) => v.status == 1)
                            .reduce(
                              (sum, producto) =>
                                sum + parseFloat(producto.total || 0),
                              0,
                            ),
                        ).toFixed(2)
                      }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD
                      {{
                        parseFloat(
                          itemsproductos
                            .filter((v) => v.status == 1)
                            .reduce(
                              (sum, producto) =>
                                sum + parseFloat(producto.montodolar || 0),
                              0,
                            ),
                        ).toFixed(2)
                      }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD
                      {{
                        parseFloat(
                          itemsproductos
                            .filter((v) => v.status == 1)
                            .reduce(
                              (sum, producto) =>
                                sum + parseFloat(producto.igvdolar || 0),
                              0,
                            ),
                        ).toFixed(2)
                      }}
                    </td>
                    <td v-if="mostrarColumna()">
                      USD
                      {{
                        parseFloat(
                          itemsproductos
                            .filter((v) => v.status == 1)
                            .reduce(
                              (sum, producto) =>
                                sum + parseFloat(producto.totaldolar || 0),
                              0,
                            ),
                        ).toFixed(2)
                      }}
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-card>
          </v-col>

          <v-col cols="12" v-if="tipo == 'nuevo' || tipo == 'editar'">
            <v-row>
              <v-col cols="12" md="8">
                <v-file-input
                  :disabled="radio == ''"
                  v-model="payfile"
                  show-size
                  label="Adjuntar archivo"
                  @change="_uploadFile()"
                  dense
                  filled
                >
                </v-file-input>
              </v-col>
              <v-col cols="12" md="4">
                <v-chip
                  block
                  v-if="boolFile"
                  large
                  class=""
                  color="success"
                  outlined
                  dense
                >
                  <v-icon left> mdi-check </v-icon>
                  Archivo cargado éxitosamente
                </v-chip>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12" md="9" v-else>
            <v-card-title primary-title> Documento referencia: </v-card-title>
            <v-simple-table dense>
              <tbody>
                <tr>
                  <td v-if="payPathName">
                    {{ name_path }}
                  </td>
                  <td v-else>
                    <v-alert color="orange" type="warning">
                      No se ha cargado documento</v-alert
                    >
                  </td>
                  <td>
                    <v-btn
                      v-if="payPathName"
                      icon
                      color="red"
                      :href="payPath"
                      target="_blank"
                    >
                      <v-icon>mdi-file-pdf-box</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-simple-table>
          </v-col>
          <v-col cols="12" class="d-flex flex-column align-end mt-2">
            <span
              v-if="
                itemsproductos.length == 0 &&
                (tipo == 'nuevo' || tipo == 'editar')
              "
              class="caption grey--text text--darken-1 mb-2"
            >
              Primero añade un concepto de cobro.
            </span>
            <v-btn
              elevation="0"
              @click="_setInvoice()"
              color="primary"
              v-if="tipo == 'nuevo'"
              :disabled="itemsproductos.length == 0"
            >
              GUARDAR CUENTA POR COBRAR
            </v-btn>
            <v-btn
              elevation="0"
              color="primary"
              v-if="tipo == 'editar'"
              @click="setUpdateInvoiceAdmin()"
            >
              GUARDAR CUENTA POR COBRAR
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-dialog
      v-model="dialog"
      persistent
      :overlay="false"
      max-width="25%"
      transition="dialog-transition"
      class="mx-5"
    >
      <v-card>
        <v-card-title primary-title> Añadir Producto/ Concepto </v-card-title>
        <v-form ref="validacionConcepto">
          <v-row class="ma-3">
            <v-col cols="12" md="12">
              <v-text-field
                placeholder="Descripción"
                label="Producto/ Concepto"
                v-model="producto.concepto"
                :rules="[(v) => !!v || 'Dato Requerido']"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="12">
              <v-text-field
                placeholder="0.00"
                label="Monto"
                v-model="producto.monto"
                type="number"
                :prefix="symbol"
                :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) => v > 0 || 'Monto Mayor que 0.00',
                ]"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="12">
              <v-radio-group row v-model="producto.afecto">
                <v-radio label="Afecto" value="true"></v-radio>
                <v-radio label="No Afecto" value="false"></v-radio>
              </v-radio-group>
            </v-col>
            <v-col cols="12" md="12">
              <v-btn
                color="success"
                class="mx-1"
                small
                @click="añadirProducto()"
              >
                Aceptar
              </v-btn>
              <v-btn color="warning" class="mx-1" small @click="dialog = false">
                Cancelar
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { validationMixin } from "vuelidate";
import { required, maxLength, email } from "vuelidate/lib/validators";
import axios from "@/api/axios-config";
import Swal from "sweetalert2";
import { mapActions, mapState } from "vuex";
// import the component
import Treeselect from "@riophae/vue-treeselect";
// import the styles
import "@riophae/vue-treeselect/dist/vue-treeselect.css";
import { parse } from "path";
export default {
  components: { Treeselect },
  name: "moduleAccountReceivableCom",
  mixins: [validationMixin],
  props: {
    operativa: "",
    exp: "",
    pro: "",
    id_pro: "",
    tipo: "",
  },
  validations: {
    name: { required, maxLength: maxLength(10) },
    email: { required, email },
    select: { required },
    checkbox: {
      checked(val) {
        return val;
      },
    },
  },
  data: () => ({
    tipoingreso: null,
    id_tipoingreso: null,
    tiposubingresoFilter: [],
    errorGasto: "",
    date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .substr(0, 10),
    menu: false,
    modal: false,
    menu2: false,
    dialog: false,
    radio: 0,
    itemsCliente: [],
    dataList: false,
    payfile: [],
    payPath: "",
    name_path: "",
    pathfile: "",
    payPath: "",
    pathfileAll: "",
    boolFile: false,
    itemsExpedientes: [],
    itemsProformace: [],
    itemsproductos: [],
    producto: {},
    facturaFlag: false,
    serieFlag: false,
    id_proformace: "",
    symbol: "",
    id_expediente: "",
    payPathName: "",
    id_cliente: "",
    fecha: "",
    nro_factura: "",
    nro_serie: "",
    id_coins: "",
    monto: "",
    igv: "",
    total: {
      monto: 0,
      total: 0,
    },
    dialogPro: false,
    conceptoRule: [(v) => !!v || "Descripción Requerida"],
    id_month: "",
    id_year: "",
    row: "",
    tipocambio: 1,
  }),
  methods: {
    ...mapActions([
      "_getBanksList",
      "_getCoinsList",
      "_getPerformance",
      "_getChargeMonth",
      "_getChargeYear",
      "_getInvoiceAdminCxC",
      "getArbolIngresos",
      "getCargarHouse",
      "getCargarTipoIngreso",
      "getCargarTipoSubIngreso",
      "cargarProveedores",
      "cargarClientes",
      "obtenerImpuestoXEmpresa",
    ]),
    abrirDialogNuevoProducto() {
      if (!this.id_coins) {
        Swal.fire({
          icon: "warning",
          title: "Advertencia",
          text: "Es necesario seleccionar una moneda.",
        });
        return false;
      }
      this.dialog = true;
    },
    clear() {
      this.$v.$reset();
      this.name = "";
      this.email = "";
      this.select = null;
      this.checkbox = false;
    },
    recalcularMonto(prod, index) {
      let igv = 0;
      let igvdolar = 0;
      let total = parseFloat(prod.monto);
      let montodolar = parseFloat(prod.monto / this.tipocambio);
      let totaldolar = parseFloat(prod.monto / this.tipocambio);
      // ------------------------------
      if (prod.afecto == "true" || prod.afecto == 1) {
        igv =
          (parseFloat(prod.monto) *
            this.$store.state.enterprises.impuesto.impuesto) /
          100;

        igvdolar = parseFloat(igv / this.tipocambio);

        totaldolar += parseFloat(igvdolar);
        console.log("totaldolar", totaldolar);
        total += parseFloat(igv);
      }
      // ------------------------------

      let producto = {
        id: prod.id,
        concepto: prod.concepto,
        monto: prod.monto,
        montodolar: parseFloat(montodolar).toFixed(2),
        igv: parseFloat(igv).toFixed(2),
        igvdolar: parseFloat(igvdolar).toFixed(2),
        afecto: prod.afecto,
        status: 1,
        total: total,
        totaldolar: totaldolar,
      };

      // Usar Vue.set para actualizar reactividad en Vue 2
      this.$set(this.itemsproductos, index, { ...producto });

      console.log(
        "Producto después de actualizar:",
        this.itemsproductos[index],
      );
    },
    _valida() {
      if (this.operativa == 1) {
        this.radio = 2;
        this._getMasterList();
        this.id_expediente = this.exp;
        this._getProformace();
        this.id_proformace = this.pro;
        this.cargarProveedores();
        this.id_proveedor = this.id_pro;
      }
    },
    sendData() {
      this.id_proveedor = this.id_proformace.id_proveedor;
    },
    sendPro(id, idPro) {
      this.id_proformace = id;
      this.id_proveedor = idPro;
      this.dialogPro = false;
    },
    _callModalEntitie() {
      this.$store.state.id_role_actual = 11;
      this.$store.state.modalAdmin = !this.$store.state.modalAdmin;
    },
    _uploadFile() {
      var FormData = require("form-data");
      var fs = require("fs");
      var data = new FormData();
      var vm = this;
      if (vm.radio == 1) {
        data.append("name", "Factura Administrativa");
      } else if (vm.radio == 2) {
        data.append("name", "Factura Operativa");
      }

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
          console.error(error);
        });
    },
    async _getMasterList() {
      var vm = this;
      let data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        data: data,
        method: "get",
        url: process.env.VUE_APP_URL_MAIN + "getHouseListAll",

        headers: {
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm.itemsExpedientes = response.data.data;
        })
        .catch(function (error) {
          console.error(error);
        });
    },
    async _getProformace() {
      var vm = this;

      var data = {
        id_house: vm.id_expediente,
      };

      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getListInvoiceExp",

        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.itemsProformace = response.data.data;
        })
        .catch(function (error) {
          console.error(error);
        });
    },
    cleanData() {
      this.radio = "";
      this.id_proveedor = "";
      this.fecha = "";
      this.nro_factura = "";
      this.nro_serie = "";
      this.id_coins = "";
      this.monto = "";
      this.igv = "";
      this.total = "";
      this.payPath = "";
      this.boolFile = false;
      this.facturaFlag = false;
      this.serieFlag = false;
    },
    async _setInvoice() {
      var vm = this;
      let validacion = vm.validarFormulario();
      if (this.itemsproductos.length == 0) {
        vm.$swal({
          icon: "error",
          title: "Aviso",
          text: "Debes cargar el concepto a pagar y su monto para poder registrar la factura.",
          allowEnterKey: false,
          allowOutsideClick: false,
        }).then((res) => {
          if (res.isConfirmed) {
            this.dialog = true;
          }
        });
        return false;
      }
      if (validacion == true) {
        vm.$swal({
          icon: "info",
          title: "Guardando...",
          text: "Por favor espere",
        });
        let productos = vm.itemsproductos.filter((v) => v.status == 1);
        var data = {
          type_payment: vm.radio,
          id_expediente: vm.id_expediente,
          id_cliente: vm.id_cliente,
          fecha: vm.date,
          nro_factura: vm.nro_factura,
          nro_serie: vm.nro_serie,
          id_coins: vm.id_coins.id,
          monto: vm.total.total,
          montodolar: vm.total.totaldolar,
          type_igv: vm.igv,
          //igv: vm.,
          total: vm.total.total,
          status: 1,
          id_path: vm.payPath,
          detalle: productos,
          id_proformance: vm.id_proformace.id,
          id_month: vm.id_month,
          id_year: vm.id_year,
          tipocambio: vm.tipocambio,
          id_tipoingreso: vm.id_tipoingreso,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
        };
        var config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + "setInvoiceAdminCxC",

          headers: {
            "Content-Type": "application/json",
          },
          data: data,
        };
        await axios(config)
          .then(function (response) {
            vm.itemsInvoice = response.data.data;

            vm.$swal({
              icon: "success",
              title: "Documento Cargado",
              text: "El documento ha sido cargado correctamente",
            });

            // if (vm.radio == 1 && vm.id_proformace > 0) {
            //   vm.putPro();
            // } else {
            vm.$router.back();
            vm.cleanData();
            // }

            // vm._getInvoice();
            // vm.dialogInvoice = false;
          })
          .catch(function (error) {
            console.error(error);
          });
      }
    },
    async setUpdateInvoiceAdmin() {
      var vm = this;

      let validacion = vm.validarFormulario();
      if (validacion == true) {
        let productos = vm.itemsproductos;
        var data = {
          type_payment: vm.radio,
          id_expediente: vm.id_expediente,
          id_cliente: vm.id_cliente,
          fecha: vm.date,
          nro_factura: vm.nro_factura,
          nro_serie: vm.nro_serie,
          id_coins: vm.id_coins.id ? vm.id_coins.id : vm.id_coins,
          monto: vm.total.total,
          montodolar: vm.total.totaldolar,
          type_igv: vm.igv,
          //igv: vm.,
          total: vm.total.total,
          status: 1,
          id_path: vm.payPath,
          detalle: productos,
          id_proformance: vm.id_proformace,
          id_month: vm.id_month,
          id_year: vm.id_year,
          id: vm.$route.params.id,
          tipocambio: vm.tipocambio,
          id_tipoingreso: vm.id_tipoingreso,
        };
        var config = {
          method: "put",
          url: process.env.VUE_APP_URL_MAIN + "setUpdateInvoiceAdminCxC",

          headers: {
            "Content-Type": "application/json",
          },
          data: data,
        };
        await axios(config)
          .then(function (response) {
            vm.$swal({
              icon: "success",
              title: "Documento Cargado",
              text: "El documento ha sido cargado correctamente",
            });

            if (vm.radio == 1 && vm.id_proformace > 0) {
              vm.putPro();
            } else {
              vm.$router.back();
              vm.cleanData();
            }

            vm.$router.push({
              name: "viewAccountPaysCxC",
              params: { id: vm.$route.params.id },
            });
            vm.dialogInvoice = false;
          })
          .catch(function (error) {
            console.error(error);
          });
      }
    },

    async putPro() {
      var vm = this;

      var data = {
        id_path: vm.payPath,
        id_proformace: vm.id_proformace,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "putPro",

        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.cleanData();

          vm._getInvoice();
          vm.$router.back();
          vm.dialogInvoice = false;
        })
        .catch(function (error) {
          console.error(error);
        });
    },

    añadirProducto() {
      if (!this.$refs.validacionConcepto.validate()) return;
      let igv = 0;
      let igvdolar = 0;
      let total = parseFloat(this.producto.monto);
      let montodolar = parseFloat(this.producto.monto / this.tipocambio);
      let totaldolar = parseFloat(this.producto.monto / this.tipocambio);
      // ------------------------------
      if (this.producto.afecto == "true" || this.producto.afecto == 1) {
        igv =
          (parseFloat(this.producto.monto) *
            this.$store.state.enterprises.impuesto.impuesto) /
          100;

        igvdolar = parseFloat(igv / this.tipocambio);

        totaldolar += parseFloat(igvdolar);
        console.log("totaldolar", totaldolar);
        total += parseFloat(igv);
      }
      // ------------------------------

      let producto = {
        id: null,
        concepto: this.producto.concepto,
        monto: this.producto.monto,
        montodolar: parseFloat(montodolar).toFixed(2),
        igv: parseFloat(igv).toFixed(2),
        igvdolar: parseFloat(igvdolar).toFixed(2),
        afecto: this.producto.afecto,
        status: 1,
        total:
          this.producto.afecto == "true"
            ? (parseFloat(this.producto.monto) *
                this.$store.state.enterprises.impuesto.impuesto) /
                100 +
              parseFloat(this.producto.monto)
            : parseFloat(this.producto.monto),
        totaldolar:
          this.producto.afecto == "true"
            ? parseFloat(
                (parseFloat(this.producto.monto / this.tipocambio) *
                  this.$store.state.enterprises.impuesto.impuesto) /
                  100 +
                  parseFloat(this.producto.monto / this.tipocambio),
              ).toFixed(2)
            : parseFloat(
                parseFloat(this.producto.monto / this.tipocambio),
              ).toFixed(2),
      };
      this.itemsproductos.push(producto);
      this.dialog = false;
      this.producto = {
        concepto: "",
        monto: null,
        afecto: true,
        total: 0,
      };
      this.calculcularTotal();
    },
    eliminar(producto) {
      this.itemsproductos.filter((v) => v == producto)[0].status = 0;
      setTimeout(() => {
        this.calculcularTotal();
      }, 200);
    },
    calculcularTotal() {
      let totalF = {
        monto: 0,
        igv: 0,
        total: 0,
        montodolar: 0,
        igvdolar: 0,
        totaldolar: 0,
      };
      this.itemsproductos
        .filter((v) => v.status == 1)
        .forEach((element) => {
          totalF.monto += parseFloat(element.monto);
          totalF.igv += parseFloat(element.igv);
          totalF.total += parseFloat(element.total);
          totalF.montodolar += parseFloat(element.montodolar);
          totalF.igvdolar += parseFloat(element.igvdolar);
          totalF.totaldolar += parseFloat(element.totaldolar);
        });
      this.total = totalF;
    },
    validacionesRequeridas() {
      switch (this.id_proformace.code) {
        case "002":
          this.facturaFlag = true;
          this.serieFlag = true;
          break;

        default:
          this.facturaFlag = false;
          this.serieFlag = false;
          break;
      }
    },
    obtenerPrefixCoins() {
      this.symbol = this.id_coins.symbol;
      this.tipocambio = 1;
      this.cambiarTipodeCambio();
    },
    validarFormulario() {
      let mensaje = "";
      let validacion = true;
      if (this.radio == "") {
        mensaje += " Seleccione una opcion Administrativa / Operativa.";
        validacion = false;
      } else {
        if ((this.id_month == "" || this.id_year == "") && this.radio == 1) {
          mensaje += "Seleccione un mes y año correspondiente a la factura.";
          validacion = false;
        }
        if (
          (this.facturaFlag && this.nro_factura == "") ||
          (this.serieFlag && this.nro_serie == "")
        ) {
          mensaje += "La factura y el número de serie son requerido.";
          validacion = false;
        }

        if (this.itemsproductos.length == 0) {
          mensaje +=
            " Para guardar la factura se necesita al menos un producto/ concepto.";
          validacion = false;
        }
      }
      if (validacion == false) {
        this.$swal({
          icon: "error",
          title: "Advertencia...",
          text: mensaje,
        });
      }

      return validacion;
    },

    cambiarTipodeCambio() {
      this.itemsproductos.forEach((element) => {
        this.recalcularMonto(element, this.itemsproductos.indexOf(element));
      });

      this.calculcularTotal();
    },
    filtarSubIngreso() {
      if (!!this.tipoingreso) {
        this.tiposubingresoFilter =
          this.$store.state.balances.tiposubingreso.filter(
            (v) => v.id_ingreso == this.tipoingreso,
          );
      } else {
        this.tiposubingresoFilter = this.$store.state.balances.tiposubingreso;
      }
    },
    mostrarColumna() {
      if (this.symbol == "USD") {
        return false;
      }
      return true;
    },
  },

  computed: {
    ...mapState(["InvoiceAdmin"]),
  },

  async mounted() {
    this.$store.state.spiner = true;
    await Promise.all([
      this.obtenerImpuestoXEmpresa(),
      this.cleanData(),
      this.getArbolIngresos(),
      this.getCargarHouse(),
      this._valida(),
      this._getPerformance(),
      this._getChargeMonth(),
      this._getChargeYear(),
      this.getCargarTipoIngreso(),
      this.getCargarTipoSubIngreso(),
      this.cargarClientes(),
      this._getCoinsList(),
      this.filtarSubIngreso(),
    ]);
    if (!!this.$route.params.id) {
      await this._getInvoiceAdminCxC(this.$route.params.id);
      this.calculcularTotal();
    }

    this.producto = {
      concepto: "",
      monto: null,
      afecto: "true",
      total: 0,
    };
    this.$store.state.spiner = false;
  },
  watch: {
    async InvoiceAdmin() {
      var vm = this;

      vm.id_proformace = vm.InvoiceAdmin[0].id_proformace;
      vm.id_expediente = vm.InvoiceAdmin[0].id_expediente;
      vm.id_cliente = vm.InvoiceAdmin[0].id_cliente;
      vm.date = new Date(vm.InvoiceAdmin[0].fecha)
        .toISOString()
        .substring(0, 10);
      vm.nro_factura = vm.InvoiceAdmin[0].nro_factura;
      vm.nro_serie = vm.InvoiceAdmin[0].nro_serie;
      vm.id_coins = vm.InvoiceAdmin[0].id_coins
        ? vm.InvoiceAdmin[0].id_coins
        : "";
      vm.monto = vm.InvoiceAdmin[0].monto;
      vm.radio = vm.InvoiceAdmin[0].type_payment;
      vm.payPathName = vm.InvoiceAdmin[0].originalname;
      vm.payPath = vm.InvoiceAdmin[0].path;
      vm.id_proformace = vm.InvoiceAdmin[0].id_proformance;
      vm.id_month = vm.InvoiceAdmin[0].id_month;
      vm.id_year = vm.InvoiceAdmin[0].id_year;
      vm.tipocambio = vm.InvoiceAdmin[0].tipocambio;
      vm.name_path = vm.InvoiceAdmin[0].name_path;

      vm.tipoingreso = vm.InvoiceAdmin[0].id_tipoingreso;
      vm.id_tipoingreso = vm.InvoiceAdmin[0].id_subingreso;
      // DETALLES

      vm.itemsproductos = vm.InvoiceAdmin[0].details;
    },
    tipoingreso() {
      this.filtarSubIngreso();
    },
  },
};
</script>
